

export interface BaseRouteConfig {
  name: string;
  path: string;
}
export interface RouteRuntimeConfig extends BaseRouteConfig{
  element: string
}
export interface RouteBuildTimeConfig extends BaseRouteConfig{
  render: (...arg: any[])=> any
}

export interface RouteConstructorContract{
    new (router: RouterContract, route: RouteConfig, parent: RouteInternalConfig['parent']) : RouteContract;
}

export type RouteConfig = {
    children?: RouteConfig[]
    meta?:RouteMeta

    // beforeResolve?: NavigationGuard | NavigationGuard[]
    // afterResolve?: NavigationGuard | NavigationGuard[]
    beforeResolve?: NavigationGuard;
    afterResolve?: NavigationGuard;
} & (RouteRuntimeConfig | RouteBuildTimeConfig)


export type RouteInternalConfig = RouteConfig & {
    keys?: string[]
    params?: Record<string, any >
    matcher: RegExp
    resolvedPath?: string
    parent: RouteContract | null
}

export type RouteNavType = Pick<RouteInternalConfig, 'name' | 'path' | 'params'>

export type RouteType = 'buildTime' | 'runTime'

export interface RouteMeta extends Record<string | number | symbol, any> { }

// export type NavigationGuardNext = (
//   to?: RouteContract | false | void
// ) => void

export type NavigationGuardContext = {
    router:RouterContract,
    to: RouteContract,
    from?: RouteContract,
    //next: NavigationGuardNext,
}

export interface NavigationGuardProps {
    beforeResolve: NavigationGuard;
    afterResolve: NavigationGuard;
    [beforeEachResolve: string]: NavigationGuard;
    afterEachResolve: NavigationGuard;
}
export type NavigationGuard = (context: NavigationGuardContext) => boolean | undefined | void;
    
export interface RouteContract {
    name: RouteConfig['name'];
    path: RouteConfig['path'];
    element: RouteRuntimeConfig['element'];
    meta: RouteConfig['meta'];
    guards?: Pick<NavigationGuardProps, 'beforeResolve' | 'afterResolve'>
    render: RouteBuildTimeConfig['render'];
    //children?: RouteConfig['children'];

    resolvedPath: RouteInternalConfig['resolvedPath'];
    keys: RouteInternalConfig['keys'];
    params: RouteInternalConfig['params'];
    isActive: boolean;

    isIndex(): boolean;
    hasParent(): boolean;
    getId(): string;
    getOriginalConfig():RouteConfig
    getParent(): RouteContract;
    getRouter(): RouterContract;
    getMatcher(): RegExp;
    getPath(): string;
    setRouteActiveStatus(status: boolean): void;
    addParamValue(key: string | Record<string, any>, value: any): void;
    isMatched(winLocPath?: string): boolean;
    extractParamsFromWinLocHash(winLocPath: string): false | Record<string, any>;
    getAllKeysForChildAndParent(keysFromChildTree: string[]): string[];
    resolveAtBuildTime(routeTree: RouteContract[]): any[]// TODO: find the type each items in the array
    resolveAtRunTime(routeTree: RouteContract[]): void

}

export interface RouterContractConstructor{
    new (baseElementName: string, routeType: RouteType) : RouterContract;
}
export interface RouterContract{
    baseElement: Element | null;
    routes: RouteContract[];
    routePathPrefix?: string;
    renderTemplate?: HTMLElement;
    history: RouteContract[];
    currentRouteInfo: RouteContract | undefined;
    renderTree: any[];
    routeType: RouteType;
    customEventDispatchers: Record<string, () => boolean>;
    guards?: Pick<NavigationGuardProps, 'beforeEachResolve' | 'afterEachResolve'>
    beforeEachResolve?: (guard: NavigationGuard) => void;
    afterEachResolve?: (guard: NavigationGuard) => void;
    isValidRoute(route: RouteConfig): boolean;
    addRoute(routeConfig: RouteConfig, parent?: RouteContract): this;
    addRoutes(routeConfigs: RouteConfig[]): this;
    getRoutes(): RouteContract[];
    getRouteTree(route: RouteContract): RouteContract[];
    setRouteAsActive(route: RouteContract): void;
    load(): this;
    addRouteToHistory(route: RouteContract): void;
    view(): any; //TODO: find what this returns
    link(link: string): string;
    push(routeConfig: string | Partial<Pick<RouteInternalConfig, 'name' | 'path'> & { params: Record<string, any> }>): false | this;
    getNotFoundError(route: RouteContract): Record<string, any>;
}

