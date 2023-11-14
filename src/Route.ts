import type {
    RouteContract,
    RouterContract,
    RouteRuntimeConfig,
    RouteBuildTimeConfig,
    RouteConfig,
    RouteInternalConfig,
    NavigationGuard,
    NavigationGuardProps,
} from './types'

import {
  NAVIGATION_GUARDS,
  hs,
  trimPath,
  getRouteFragments,
  getWinLocationHashFragment,
  formatToHTMLAttribute,
  getPrefixedPath,
  mergePathWithParentPath,
  createUUID,
  createPathMatcher,
  getElementKeys,
  appendNodeToParent,
} from './utils'

class Route implements RouteContract{
    id: Readonly<string>
    name: RouteConfig['name']
    path: RouteConfig['path']
    element: RouteRuntimeConfig['element']
    meta: RouteConfig['meta'];
    guards?: Pick<NavigationGuardProps, 'beforeResolve' | 'afterResolve'>
    render: RouteBuildTimeConfig['render']

    resolvedPath: RouteInternalConfig['resolvedPath']
    keys: RouteInternalConfig['keys']
    params: RouteInternalConfig['params']
    matcher: RouteInternalConfig['matcher']
    parent: RouteInternalConfig['parent']
    originalConfig: Readonly<RouteConfig>
    router: RouterContract
    isActive: boolean = false
  
  constructor(router: RouterContract, route: RouteConfig, parent: RouteInternalConfig['parent']) {
    this.router = router as RouterContract
    this.id = createUUID()
    this.originalConfig = route
    this.name = route.name
    this.path = mergePathWithParentPath(route.path, parent?.path)
    this.meta = route.meta
    this.element = (route as RouteRuntimeConfig).element
    this.render = (route as RouteBuildTimeConfig).render
    this.parent = parent
      if (route.beforeResolve) {
        this.guards = {...this.guards, ...{[NAVIGATION_GUARDS.beforeResolve as keyof RouteContract['guards']]: route.beforeResolve as NavigationGuard}} as any
        //this.beforeResolveGuard = route.beforeResolve as NavigationGuard
    }
    if (route.afterResolve) {
        this.guards = {...this.guards, ...{[NAVIGATION_GUARDS.afterResolve as keyof RouteContract['guards']]: route.afterResolve as NavigationGuard}} as any
        //this.afterResolveGuard = route.afterResolve as NavigationGuard
    }

    this.matcher = createPathMatcher(this.path)
    // this.keys = getElementKeys(route.path)
    //   .filter(key => key.length > 0)
    //   .map((key: string) => formatToHTMLAttribute(key))
    
    this.keys = getElementKeys(route.path)
      .filter(key => key.length > 0)
    
    this.params = {}
  }

  clone() {
    return new Route(this.router as RouterContract, this.originalConfig, this.parent);
  }

  setRouteActiveStatus(status:boolean) {
    this.isActive = status
  }

  addParamValue(key: string|Record<string, any>, value: any) {
    if(typeof key !== 'string'){
      this.params = {...this.params, ...key}
    } else {
      this.params = {...this.params, ...{[key]: value}}
    }
  }

  hasParent() { return !!this.parent }
  getParent() {return this.parent as RouteContract}

  getRoutePathChunks(){getRouteFragments(this.path)}

  getPath(path?: string){
    let routePath = path || this.path
    return  routePath === '/' ? '' : trimPath(routePath)
  }

  isMatched(winLocPath?:string){
    if (winLocPath) {
      return this.matcher.test(winLocPath)
    }
    const currentLocPath = getWinLocationHashFragment(true)

    if (this.path == '') {
      // There is no need to test with matcher just compare current path on browser with route's stored path with prefix(if available)
      return currentLocPath == getPrefixedPath(this.getPath(), this.router.routePathPrefix)
    }
    if (this.router.routePathPrefix) {
      // We have to remove the prefix since matcher was not created with the prefix
      return this.matcher.test(currentLocPath.replace(`/${this.router.routePathPrefix}`,''))
    } else {
      return this.matcher.test(currentLocPath)
    }
  }

  extractParamsFromWinLocHash (winLocPath:string){
    if (this.isMatched(winLocPath)) {
      const match = winLocPath.match(this.matcher);
      if (match) {
        match.shift();
        let paramValues: Record<string, any> = {};
        if (this.keys?.length) {
          const keys = this.getAllKeysForChildAndParent(this.keys)
          for (let i = 0; i < keys.length; i++) {
            if (match[i]) {
              paramValues[keys[i]] = match[i];
            }
          }
        }
        return paramValues;
      }
    }
    return false
  }

  getAllKeysForChildAndParent(keysFromChildTree: string[]): string[] {
    if (!this.hasParent()) {
      return keysFromChildTree
    } else {
      const parent = this.getParent()
      keysFromChildTree = [...parent?.keys as string[], ...keysFromChildTree]
      return parent?.getAllKeysForChildAndParent(keysFromChildTree) as string[]
    }
  }


resolveAtBuildTime(routeTree: RouteContract[]) {
  let currentLocPath = getWinLocationHashFragment(true)
  if (this.router.routePathPrefix) {
    // We have to remove the prefix since matcher was not created with the prefix
    currentLocPath = currentLocPath.replace(`/${this.router.routePathPrefix}`,'')
  }

  // These are to be unset when adding the setting the route as the current route of the router
  this.params = this.extractParamsFromWinLocHash(currentLocPath) as Record<string, any>
  this.resolvedPath = currentLocPath
  // These are to be unset when adding the setting the route as the current route of the router


  let renderTree:any[] = [];
  for (let i = 0; i < routeTree.length; i++) {
    let route = routeTree[i]

    const elementParams: Record<string, any> = {}
    route.keys?.forEach((key: string) => {
      if ((this.params as Record<string, any>)[key]) {
        elementParams[key] = (this.params as Record<string, any>)[key]
      }
    })


    renderTree.push(route.render(elementParams))

  }
  return renderTree
}



resolveAtRunTime(routeTree: RouteContract[]) {

    let currentLocPath = getWinLocationHashFragment(true)
    if (this.router.routePathPrefix) {
      // We have to remove the prefix since matcher was not created with the prefix
      currentLocPath = currentLocPath.replace(`/${this.router.routePathPrefix}`,'')
    }

    // These are to be unset when adding the setting the route as the current route of the router
    this.params = this.extractParamsFromWinLocHash(currentLocPath) as Record<string, any>
    this.resolvedPath = currentLocPath
    // These are to be unset when adding the setting the route as the current route of the router

    // Assign baseElement from router as the parent element
    let parentElement: Element = this.router.baseElement as Element
    

    for (let i = 0; i < routeTree.length; i++){
      let route = routeTree[i]

      const elementParams: Record<string, any> = {}
      route.keys?.forEach((key: string) => {
        if ((this.params as Record<string, any>)[key]) {
          elementParams[formatToHTMLAttribute(key)] = (this.params as Record<string, any>)[key]
        }
      })

      let node = hs(route.element, { ...elementParams })

      appendNodeToParent(parentElement as Element, node)
      
      parentElement = parentElement.querySelector(route.element) as Element
      
    }
  
  }

  

}
export  default Route