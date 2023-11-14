
import { getElement, ComponentInterface } from '@stencil/core';
import { Router} from '../Router'
import { type RouteType} from '../types'


const loadWcStyle = (hostEl: Element, style: string) => {
  const link = document.createElement('link')
  link.type = 'text/css'
  link.rel = 'stylesheet preload'
  link.href = style
  link.as = 'style'
  hostEl?.prepend(link)
}

export const StylesInject = (styles?: string[]) => {
  return function (target: ComponentInterface, propertyKey: string, descriptor: PropertyDescriptor) {

    const { componentWillLoad } = target;
    if (!componentWillLoad) console.warn(`StylesInject requires you to have a \`componentWillLoad\` lifecycle method in \`${ target.constructor.name }\`. Failure to add this function may cause StylesInject to fail due to StencilJS build optimizations.`);
      
    if (propertyKey == 'componentWillLoad') {
      descriptor.value = function() {
        const result = componentWillLoad && componentWillLoad.call(this);

        const host = getElement(this);
        const root = (host.shadowRoot || host) as any;

        // Load all given styles if given
        if (styles?.length) styles.reverse().forEach((style) => loadWcStyle(root, style))
  
        return result;
      }
    }
  };
}

export const RouterInject = (router: Router, isBase:boolean=false) => {
  return function (target: ComponentInterface, propertyKey: string, descriptor: PropertyDescriptor) {

    const { componentDidRender, connectedCallback, disconnectedCallback } = target;
    if (isBase && !componentDidRender) console.warn(`RouterInject requires you to have a \`componentDidRender\` lifecycle method in \`${ target.constructor.name }\`. Failure to add this function may cause RouterInject to fail due to StencilJS build optimizations.`);
    if (!connectedCallback) console.warn(`RouterInject requires you to have a \`connectedCallback\` lifecycle method in \`${ target.constructor.name }\`. Failure to add this function may cause RouterInject to fail due to StencilJS build optimizations.`);
    //if (!disconnectedCallback) console.warn(`RouterInject requires you to have a \`disconnectedCallback\` lifecycle method in \`${ target.constructor.name }\`. Failure to add this function may cause RouterInject to fail due to StencilJS build optimizations.`);
      
    if (propertyKey == 'componentDidRender') { 
      descriptor.value = function() {
        const result = componentDidRender && componentDidRender.call(this);
        
        renderPageOn('runTime')
  
        return result;
      }
    }

    const renderPageOn = (routeType: RouteType) => {
        if (router.routeType == routeType) {
          router.load()
        }  
    }

    const reRender = (elClass: any) => {
      // This should work for only buildTime as router.load for runTime should only happen after rendering see componentDidRender
      if (isBase) {
        renderPageOn('buildTime')
      }

      // This will trigger re-render for both runTime and buildTIme
      elClass.uniqueId = (new Date()).getTime()
    }
    
    if (propertyKey == 'connectedCallback') {
      descriptor.value = function() {
        const result = connectedCallback && connectedCallback.call(this);

        // This should work for only buildTime as router.load for runTime should only happen after rendering see componentDidRender
        if (isBase) {
          renderPageOn('buildTime')
        }
        // Load Router
        router.onRouteChange(() => reRender(this))
        router.onPageLoad(() => reRender(this))
  
        return result;
      }
    }
    if (propertyKey == 'disconnectedCallback') {
      descriptor.value = function() {
        const result = disconnectedCallback && disconnectedCallback.call(this);

        // Load Router
        window.removeEventListener("hashchange", () => reRender(this));
        window.removeEventListener("load", () => reRender(this));
        return result;
      }
    }

  };
}