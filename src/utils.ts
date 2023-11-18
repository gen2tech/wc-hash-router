export const EVENT_PROPS = {
  beforeResolve: 'beforeResolve',
  afterResolve: 'afterResolve'
}

export const NAVIGATION_GUARDS = {
    beforeResolve: 'beforeResolve',
    afterResolve: 'afterResolve',
    beforeEachResolve: 'beforeEachResolve',
    afterEachResolve: 'afterEachResolve'
}


export const createRouterEvent = (name: string, detail?: any, createDispatcher:boolean=true) => {
    const customEvt = new CustomEvent(`wc-hash-router-${name}`, { detail });
    // dispatchEvent returns false if event is cancelable, and at least one of the event handlers which received event called Event.preventDefault(). Otherwise true
    return createDispatcher
        ? (() => !window.dispatchEvent(customEvt)) as () => boolean
        : customEvt as CustomEvent<any>
}


/**
 * You must use this with the createRouterEvent above like below
 
        EITHER:
        const eventDispatcher = createRouterEvent('evtNameOne', { test: true }, true) as () => boolean
        const removeEvent = handleRouterEvent('evtNameOne', (e) => {
            console.log('custom-e', e)
        }, eventDispatcher);
        removeEvent()

        OR:
        const removeEvent2 = handleRouterEvent('evtNameTwo', (e) => {
            console.log('custom-e2', e)
        });
        const customEvt = createRouterEvent('evtNameTwo', { test2: true }, false)
        !window.dispatchEvent(customEvt as CustomEvent<any>)
        removeEvent2()

 */
export const handleRouterEvent = (name: string, listener: EventListenerOrEventListenerObject, eventDispatchCallback?: () => boolean): () => void => {
    window.addEventListener(`wc-hash-router-${name}`, listener)
    if (eventDispatchCallback) {
        eventDispatchCallback()
    }
    return () => window.removeEventListener(`wc-hash-router-${name}`, listener)
}

export const isObject = (o: any) => {
  // guard against null passing the typeof check
  return typeof o === 'object' && !!o;
}

export const isFunction = (f: any) =>{
  return typeof f === 'function';
}

export const isString = (s: any) =>{
  return typeof s === 'string';
}

export const isAsyncFunction = (func: any) => {
    const AsyncFunction = (async () => { }).constructor;
    return (func instanceof AsyncFunction && AsyncFunction !== Function) === true || func[Symbol.toStringTag] === 'AsyncFunction';
}

export const isRouteParam = (routePart: string) => routePart.startsWith(':')

  export const isOptionalRouteParam = (routePart: string) => isRouteParam(routePart) && routePart.endsWith('?')
  
  export const isRegexRouteParam = (routePart: string) => ![null, undefined, -1].includes(routePart.indexOf('[')) && ![null, undefined, -1].includes(routePart.lastIndexOf(']'))

  export const extractRoutePartRegex = (part: string) => part.substring(part.indexOf('[') + 1, part.lastIndexOf(']'))
  
  export const getRouteRegexParamName = (part: string) => part.substring(part.indexOf(':')+1, part.indexOf('['))

  export const trimPath = (routePath: string) => routePath?.toString().replace(/^\/|\/$/g, '')

  export const getRouteFragments = (routePath: string)=> trimPath(routePath).split('/').map(p => p.trim()).filter(p => p.length > 0)

  export const getWinLocationHashFragment = (removeHash?: boolean) => !removeHash ? trimPath(window.location.hash) : trimPath(window.location.hash).substring(1) || '/'

  export const formatToHTMLAttribute = (inputString: string) => inputString.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

  export const  getPrefixedPath = (path: string, prefix?: string) => {
    path = trimPath(path)
    prefix = trimPath(prefix || '')
    return prefix ? `/${trimPath('/' + prefix + '/' + path)}` : `/${path}`
  }

  export const mergePathWithParentPath = (path: string, parentPath?: string) => {
      path = trimPath(path);
      if (!parentPath) {
        return path 
      } else {
        parentPath = trimPath(parentPath);
        
        let mergedPath = "/" + parentPath;
        mergedPath += path ? "/" + path : "";
        return mergedPath;
      }
  }

  export const createUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }


  
  /**
   * Convert a path to a regular expression, considering optional parameters
   * Adapted from a comprehensive package https://github.com/pillarjs/path-to-regexp
   * 
   * @param path The path on which matcher is created
   * @param strict When true the regexp won't allow an optional trailing delimiter to match. (default: true)
   * @param sensitive When true the regexp will be case sensitive. (default: false)
   * @param end When true the regexp will match to the end of the string. (default: true)
   * @returns 
   */
  export const createPathMatcher = (path: string, strict: boolean = true, sensitive: boolean = false, end:boolean=true) => {
    const segments = getRouteFragments(path)
    let regex = `^`
    for (let i = 0; i < segments.length; i++){

      if (isRouteParam(segments[i])) {
        // Set default pattern for any route params
        let defaultParamPattern = `/((?:[^/]+?))`;

        if (isRegexRouteParam(segments[i])) {
          const segmentRegex = extractRoutePartRegex(segments[i]);
          defaultParamPattern = `/((?:${segmentRegex}))`;
        }
        if (isOptionalRouteParam(segments[i])) {
          regex += `(?:${defaultParamPattern})?`;
        } else {
          regex += defaultParamPattern;
        }
      } else {
        regex += `/${segments[i]}`;
      }
    }
    if (!strict) {
        regex += `(?:/(?=$))?`;
    }
    regex += !end ? `(?=\/|$)` : `$`;

    const matcher = new RegExp(regex, !sensitive ? 'i' : undefined)
    return matcher;
  }

  export const getElementKeys = (path: string) => {
    const segments = getRouteFragments(path)
    const keys = []
    for (let i = 0; i < segments.length; i++) {
      if (isRouteParam(segments[i])) {
        let segmentKey = segments[i].replace(/[:?]/g, '');
        if (isRegexRouteParam(segments[i])) {
          segmentKey = getRouteRegexParamName(segmentKey)
        }
        keys.push(segmentKey)
      }
    }
    return keys
  }

  export const appendNodeToParent = (parentElement: Element, node: Node) => {
    // Remove any previous router
    const WcRouterView = parentElement.querySelector('div[slot="wc-router-view"]')
    if (WcRouterView) {
      parentElement.removeChild(WcRouterView as Element)
    }
    // Create a div element referencing the slot inside the custom element
    const DIV = document.createElement('div');
    DIV.slot = "wc-router-view";
    // Append the node to the div
    DIV.appendChild(node)
    
    // Append the div to the parent of the slot
    parentElement?.appendChild(DIV)
  }

  export const hs = (tag: any, attributes?: Record<string, any>, children?: any) => {
  const element = document.createElement(tag) as Element;

  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }

  if (children !== undefined) {
    children = !Array.isArray(children) ? [children] : children
    if (children && Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }
  }
  
  return element;
};