export interface LookupData {
    params: {
        [key: string]: string;
    };
}
export interface LookupResult<T> extends LookupData {
    data?: T;
}
export declare class RouteNode<T = any> {
    name: string;
    depth: number;
    data?: T;
    children: {
        [key: string]: RouteNode;
    };
    placeholders: RouteNode[];
    constructor(name: string, depth: number);
    get hasChildren(): boolean;
    insert(path: string[], data: T): RouteNode<T>;
    remove(path: string[]): void;
    lookup(path: string[], info: LookupData): LookupResult<T> | null;
}
export declare class Router<T = any> {
    root: RouteNode<T>;
    constructor(root?: RouteNode<T>);
    getPath(path: string): string[];
    insert(path: string, data: T): RouteNode<T>;
    remove(path: string): void;
    lookup(path: string): LookupResult<T>;
}
