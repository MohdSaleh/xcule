import { Schema } from './schema';
export type PropertyResolver<T, V, C> = ((value: V | undefined, obj: T, context: C, status: ResolverStatus<T, C>) => Promise<V | undefined>) & {
    [IS_VIRTUAL]?: boolean;
};
export type VirtualResolver<T, V, C> = (obj: T, context: C, status: ResolverStatus<T, C>) => Promise<V | undefined>;
export declare const IS_VIRTUAL: unique symbol;
/**
 * Create a resolver for a virtual property. A virtual property is a property that
 * is computed and never has an initial value.
 *
 * @param virtualResolver The virtual resolver function
 * @returns The property resolver function
 */
export declare const virtual: <T, V, C>(virtualResolver: VirtualResolver<T, V, C>) => PropertyResolver<T, V, C>;
export type PropertyResolverMap<T, C> = {
    [key in keyof T]?: PropertyResolver<T, T[key], C> | ReturnType<typeof virtual<T, T[key], C>>;
};
export type ResolverConverter<T, C> = (obj: any, context: C, status: ResolverStatus<T, C>) => Promise<T | undefined>;
export interface ResolverOptions<T, C> {
    schema?: Schema<T>;
    /**
     * A converter function that is run before property resolvers
     * to transform the initial data into a different format.
     */
    converter?: ResolverConverter<T, C>;
}
export interface ResolverConfig<T, C> extends ResolverOptions<T, C> {
    /**
     * @deprecated Use the `validateData` and `validateQuery` hooks explicitly instead
     */
    validate?: 'before' | 'after' | false;
    /**
     * The properties to resolve
     */
    properties: PropertyResolverMap<T, C>;
}
export interface ResolverStatus<T, C> {
    path: string[];
    originalContext?: C;
    properties?: (keyof T)[];
    stack: PropertyResolver<T, any, C>[];
}
export declare class Resolver<T, C> {
    readonly options: ResolverConfig<T, C>;
    readonly _type: T;
    propertyNames: (keyof T)[];
    virtualNames: (keyof T)[];
    constructor(options: ResolverConfig<T, C>);
    /**
     * Resolve a single property
     *
     * @param name The name of the property
     * @param data The current data
     * @param context The current resolver context
     * @param status The current resolver status
     * @returns The resolver property
     */
    resolveProperty<D, K extends keyof T>(name: K, data: D, context: C, status?: Partial<ResolverStatus<T, C>>): Promise<T[K]>;
    convert<D>(data: D, context: C, status?: Partial<ResolverStatus<T, C>>): Promise<T | D>;
    resolve<D>(_data: D, context: C, status?: Partial<ResolverStatus<T, C>>): Promise<T>;
}
/**
 * Create a new resolver with `<DataType, ContextType>`.
 *
 * @param options The configuration for the returned resolver
 * @returns A new resolver instance
 */
export declare function resolve<T, C>(properties: PropertyResolverMap<T, C>, options?: ResolverOptions<T, C>): Resolver<T, C>;
export declare function resolve<T, C>(options: ResolverConfig<T, C>): Resolver<T, C>;
