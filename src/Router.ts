/**
 * This router library is specifically made for Seamless HR Platform applications
 * Because platform team needs to build application that can be absorbed/embedded by the main projects(Host Applications)
 * This router is solely based on "Hash Routing" method(i.e its route path comes from the path after the hash(#) in the URL)
 *
 * See readme.md for more information
 */
import Route from './Route'
import type {
  RouteType,
  RouteContract,
  RouterContract,
  RouteConfig,
  RouteInternalConfig,
  NavigationGuard,
  NavigationGuardProps
} from './types'

import {
  EVENT_PROPS,
  NAVIGATION_GUARDS,
  isRouteParam,
  isOptionalRouteParam,
  isRegexRouteParam,
  getRouteRegexParamName,
  trimPath,
  getRouteFragments,
  getPrefixedPath,
  isAsyncFunction,
  createRouterEvent,
  handleRouterEvent
} from './utils'



// class RouterView extends HTMLElement {
//   router: any
//   constructor() {
//     super()
//   }
//   connectedCallback() {
//     let lastChild = this?.lastChild
//     while (lastChild) {
//       this?.removeChild(lastChild)
//       lastChild = this?.lastChild
//     }
//     const template = document.createElement('template');
//     template.innerHTML = `<slot name='wc-router-view'></slot>`;
//     this.appendChild(template.content.cloneNode(true));
//   }
// }


const CreateWCRouter = (baseElementName: string, routeType?: RouteType):Router => {
  // TODO: Make sure router-view works
  //window.customElements.define('wc-router-view', RouterView);
  return new Router(baseElementName, routeType)
}

export default CreateWCRouter

export class RouteNav{

}

export class Router implements RouterContract {
  baseElement: Element | null
  routes: RouteContract[] = []
  routePathPrefix?: string
  renderTemplate?: HTMLElement
  history: RouteContract[] = []
  currentRouteInfo: RouteContract | undefined = undefined
  renderTree: any[] = []
  routeType: RouteType
  guards?: Pick<NavigationGuardProps, 'beforeEachResolve' | 'afterEachResolve'>
  customEventDispatchers: Record<string, () => boolean> = {}



  constructor(baseElementName: string, routeType = 'buildTime') {
    this.routes = []
    this.baseElement = document.querySelector(baseElementName)
    this.routePathPrefix = this.baseElement?.getAttribute('route-prefix') as string | undefined
    this.routeType = routeType as RouteType
  }


  /**
   * Router event onBeforeResolve should be called inside connectedCallback 
   * and the returned method(if any) should be called inside disconnectedCallback
   * 
   * @handler: EventListenerOrEventListenerObject
   * @return: void | (() => void)
   */
  onBeforeResolve(handler: EventListenerOrEventListenerObject): void | (() => void) {
    if (this.customEventDispatchers.hasOwnProperty(EVENT_PROPS.beforeResolve)) {
      const removeEvent = handleRouterEvent(EVENT_PROPS.beforeResolve, handler, this.customEventDispatchers[EVENT_PROPS.beforeResolve])
      return removeEvent
    }
  }

  /**
   * Router event onAfterResolve should be called inside connectedCallback 
   * and the returned method(if any) should be called inside disconnectedCallback
   * 
   * @handler: EventListenerOrEventListenerObject
   * @return: void | (() => void)
   */
  onAfterResolve(handler: EventListenerOrEventListenerObject): void | (() => void) {
    if (this.customEventDispatchers.hasOwnProperty(EVENT_PROPS.afterResolve)) {
      const removeEvent = handleRouterEvent(EVENT_PROPS.afterResolve, handler, this.customEventDispatchers[EVENT_PROPS.afterResolve])
      return removeEvent
    }
  }

  /**
   * Router event onRouteChange should be called inside connectedCallback 
   * and the returned method should be called inside disconnectedCallback
   * 
   * @handler: EventListenerOrEventListenerObject
   * @return: void | (() => void)
   */
  onRouteChange(handler: EventListenerOrEventListenerObject): void | (() => void) {
    window.addEventListener('hashchange', handler, false)
    return () => window.removeEventListener('hashchange',handler)
  }

  /**
   * Router event onPageLoad should be called inside connectedCallback 
   * and the returned method should be called inside disconnectedCallback
   * 
   * @handler: EventListenerOrEventListenerObject
   * @return: void | (() => void)
   */
  onPageLoad(handler: EventListenerOrEventListenerObject): void | (() => void) {
    window.addEventListener('load', handler, false)
    return () => window.removeEventListener('load',handler)
  }


  route(): RouteContract{
    return this.currentRouteInfo as RouteContract
  }


  async processBeforeResolveGuards(to: RouteContract, from: RouteContract) {
    const router = this
    let isSafeToResolve: boolean | undefined | void
    try {
      if (this.guards?.beforeEachResolve) {
        if (isAsyncFunction(this.guards?.beforeEachResolve)) {
          isSafeToResolve = await this.guards?.beforeEachResolve({router, to, from})
        } else {
          isSafeToResolve = this.guards?.beforeEachResolve({router, to, from})
        }
        if (isSafeToResolve === false) {
          // There is no reason to continue
          return false
        }
      }
      if (to.guards?.beforeResolve) {
        if (isAsyncFunction(to.guards?.beforeResolve)) {
          isSafeToResolve = await to.guards?.beforeResolve({router, to, from})
        } else {
          isSafeToResolve = to.guards?.beforeResolve({router, to, from})
        }
      }
      return [undefined, true].includes(isSafeToResolve as boolean | undefined) ? true : false
    } catch (error) {
      // Handle errors or redirect if necessary
      console.error(`Error in before hook: ${error}`);
    }
  }
  processAfterResolveGuards(to: RouteContract) {
    const router = this
    try {
      if (to.guards?.afterResolve) {
        if (isAsyncFunction(to.guards?.afterResolve)) {
          ; (async () => await to.guards?.afterResolve({router, to}))()
        } else {
          to.guards?.afterResolve({router, to})
        }
      }
      if (this.guards?.afterEachResolve) {
        if (isAsyncFunction(this.guards?.afterEachResolve)) {
          ; (async () => await this.guards?.afterEachResolve({router, to}))()
        } else {
          this.guards?.afterEachResolve({router, to})
        }
      }
    } catch (error) {
      // Handle errors or redirect if necessary
      console.error(`Error in after hook: ${error}`);
    }
  }

  start(){
    // window.addEventListener('hashchange', () => {
    //   const sampleOne = el?.shadowRoot?.querySelector('wc-router-view')
    //   sampleOne?.appendChild(new DOMParser().parseFromString(`<p>My Web Component</p>`, 'text/html').body)
    //   const vnode = hs('sample-one', {first: 'Oladele'})
    //   sampleOne?.appendChild(vnode)
    // })



    window.addEventListener('hashchange', () => this.load, false)
    window.addEventListener('load', () => this.load, false)
    return this
  }

  beforeEachResolve(guard: NavigationGuard) {
    this.guards = {...this.guards, ...{[NAVIGATION_GUARDS.beforeEachResolve as keyof RouterContract['guards']]: guard}} as any
    return this
  }
  afterEachResolve(guard: NavigationGuard){
    this.guards = {...this.guards, ...{[NAVIGATION_GUARDS.afterEachResolve as keyof RouterContract['guards']]: guard}} as any
    return this
  }

  isValidRoute(route: RouteConfig){
      const routePathChunks = getRouteFragments(route.path)
      let optionalFound = false
      let routePathIsValid = true
    for (const part of routePathChunks || []) {
      // Check if the path doesn't contain any whitespace
      if (new RegExp(/\s/g).test(part)) {
          return false
      }

      //If routePath chunk is a param and is not valid param
      if (isRouteParam(part)) {
        if (!new RegExp(/^:.*[?]?$/g).test(part)) {
      // if (isRouteParam(part) && !isRegexRouteParam(part)) { // Because the regex does not match route regex
      //   if (!new RegExp(/^:\w+[?]?$/g).test(part)) {
          routePathIsValid = false
          throw new Error(`Route param '${part}' is not valid`)
        }

        // If an optional param is set before a required parameter should throws an error
        if (optionalFound && !isOptionalRouteParam(part)) {
          routePathIsValid = false
          throw new Error(`Required param/part '${part}' cannot be set after an optional param`)
        }
        if (isOptionalRouteParam(part)) {
          optionalFound = true
          continue
        }
      }

    }
    return routePathIsValid
  }

  addRoute(routeConfig: RouteConfig, parent?: RouteContract) {
    
    if (routeConfig.path == '/' || this.isValidRoute(routeConfig)) {
      let route = new Route(this, {...routeConfig, ...{routePathPrefix: this.routePathPrefix as string}}, parent as RouteContract)
      //this.routes[route.path] = route
      this.routes.push(route as RouteContract)

      if (routeConfig.hasOwnProperty('children')) {
        //TODO: deal with route's children eg append path to the path of each of the children and resolve parent before children
        routeConfig.children?.forEach((child:RouteConfig)=> this.addRoute(child, route as RouteContract))
      }
    }
    return this
  }

  getRoutes() {
    return this.routes
  }


  addRoutes(routeConfigs: RouteConfig[]) {
    // TODO: make sure route names are unique
    //routeConfigs = Array.from(new Set(routeConfigs.map((config:RouteConfig) => config.name)))
    routeConfigs.forEach((routeConfig) => {
      this.addRoute(routeConfig)
    })
    return this
  }


  getRouteTree(route: RouteContract) {
    const routes: RouteContract[] = []
    while (route.hasParent()) {
      routes.unshift(route)
      route = route.getParent() as RouteContract
    }
    routes.unshift(route)
    return routes;
  }

  setRouteAsActive(route: RouteContract) {
    this.routes.map((r: RouteContract)=>{
      r.setRouteActiveStatus(false)
      return r
    })
    route.setRouteActiveStatus(true)
  }

  // This should run when hash changes
  load() {
    const route = this.routes.find((route: RouteContract) => route.isMatched())
    if (route) {
      this.customEventDispatchers[EVENT_PROPS.beforeResolve]  = createRouterEvent(EVENT_PROPS.beforeResolve, {to:route, from:this.currentRouteInfo}) as () => boolean
      ; (async () => {
        if (await this.processBeforeResolveGuards(route, this.currentRouteInfo as RouteContract)) {
          this.setRouteAsActive(route)
          if (this.routeType == 'runTime') {
            route.resolveAtRunTime(this.getRouteTree(route))
          } else {
            this.renderTree = route.resolveAtBuildTime(this.getRouteTree(route))
          }
          this.addRouteToHistory(route)
          this.processAfterResolveGuards(route)
          this.customEventDispatchers[EVENT_PROPS.afterResolve]  = createRouterEvent(EVENT_PROPS.afterResolve, {to:route}) as () => boolean
        } else {
          // Change the location hash to current Route hash (for now - only if routeType is buildTIme as runTime works with browser DOM and won't manipulate the DOM)
          if (this.routeType == 'buildTime') {
            window.location.hash = `#${getPrefixedPath((this.currentRouteInfo as RouteContract)?.resolvedPath as string, this.routePathPrefix)}`
          }
        }
      })()
    }
    return this
  }

  addRouteToHistory(route:RouteContract) {
    if (this.currentRouteInfo) {
      // So that  modification on currentRouteInfo will not modify the one
      this.history.push(Object.assign({}, this.currentRouteInfo))
    }
    this.currentRouteInfo = Object.assign({}, route)
    route.params = {}
    route.resolvedPath = ''
  }

  view() {
    if (this.renderTree.length) {
      //return this.renderTree.shift()
      const tree = this.renderTree.shift()
      return tree
    }
  }
  
  link(link: string){
    return '#' + getPrefixedPath(link, this.routePathPrefix)
  }

  push(routeConfig: string | Partial<Pick<RouteInternalConfig, 'name' | 'path'> & {params: Record<string, any>}>){
    let pathToPushTo: string | boolean = ''
    //TODO: get the current route and add it to history
    if (typeof routeConfig === 'string') {
      pathToPushTo = routeConfig
    } else {
      if (!routeConfig.name && !routeConfig.path) {
        return false
      }
      if (routeConfig.path) {
        pathToPushTo = routeConfig.path
      }

      if(routeConfig.name) {
        const route = this._findRouteByName(routeConfig.name)
        // This means the route is not one that has params so we can route to it
        if (!route.keys?.length) {
          pathToPushTo = route.path
        } else {
          pathToPushTo = this._createLocationHashFromRoute(route, routeConfig.params as Record<string, any>)
        }
      }
    }
    if (pathToPushTo) {
      this._pushToPath(pathToPushTo)
    }
    return this
  }



  getNotFoundError(route: RouteContract) {
    const error = new Error(`Page not found (${route.path})`);
    return {error, route, code: 404};
  }


  private _createLocationHashFromRoute(route: RouteContract, providedParams: Record<string, any>){

    let hashPath = getRouteFragments(trimPath(route.path)).map((fragment: string) => {
      if (!isRouteParam(fragment)) {
        return fragment
      } else {
        let routeParamName = fragment.replace(/[:?]/g, '');
        if (isRegexRouteParam(fragment)) {
          routeParamName = getRouteRegexParamName(routeParamName)
        }
        if (route.keys?.includes(routeParamName) && providedParams.hasOwnProperty(routeParamName)) {
          return providedParams[routeParamName]
        }
      }
    }).filter(p => p?.length > 0).join('/')

    hashPath = '/' + trimPath(hashPath)
    if (route.matcher.test(hashPath)) {
      return hashPath
    }
    return false
  }

  private _pushToPath (path:string) {
    const route = this._findRouteByPath(path)
    if (route) {
      //window.location.href = `${window.location.href.replace(/#(.*)$/, '')}#${getPrefixedPath(path, this.routePathPrefix)}`
      window.location.hash = `#${getPrefixedPath(path, this.routePathPrefix)}`
    }
    return false;
  }

  private _findRouteByName (name:string){
    return this.routes.find((route: RouteContract) => route.name === name) as RouteContract
  }

  private _findRouteByPath (path: string) {
    path = '/'+ trimPath(path)
    let route: RouteContract = null!;
    route = this.routes.find((route: RouteContract) => route.path === path) as RouteContract
    if (!route) {
      route = this.routes.find((r: RouteContract) => r.matcher.test(path)) as RouteContract
    }
    return route
  }

}
