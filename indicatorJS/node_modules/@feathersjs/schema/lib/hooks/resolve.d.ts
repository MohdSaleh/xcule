import { HookContext, NextFunction } from '@feathersjs/feathers';
import { Resolver } from '../resolver';
export type ResolverSetting<H extends HookContext> = Resolver<any, H> | Resolver<any, H>[];
export declare const resolveQuery: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(...resolvers: Resolver<any, H>[]) => (context: H, next?: NextFunction) => Promise<any>;
export declare const resolveData: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(...resolvers: Resolver<any, H>[]) => (context: H, next?: NextFunction) => Promise<any>;
export declare const resolveResult: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(...resolvers: Resolver<any, H>[]) => (context: H, next: NextFunction) => Promise<void>;
export declare const DISPATCH: unique symbol;
export declare const getDispatchValue: (value: any) => any;
export declare const getDispatch: (value: any) => any;
export declare const setDispatch: (current: any, dispatch: any) => any;
export declare const resolveExternal: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(...resolvers: Resolver<any, H>[]) => (context: H, next: NextFunction) => Promise<void>;
export declare const resolveDispatch: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(...resolvers: Resolver<any, H>[]) => (context: H, next: NextFunction) => Promise<void>;
type ResolveAllSettings<H extends HookContext> = {
    data?: {
        create: Resolver<any, H>;
        patch: Resolver<any, H>;
        update: Resolver<any, H>;
    };
    query?: Resolver<any, H>;
    result?: Resolver<any, H>;
    dispatch?: Resolver<any, H>;
};
/**
 * Resolve all resolvers at once.
 *
 * @param map The individual resolvers
 * @returns A combined resolver middleware
 * @deprecated Use individual data, query and external resolvers and hooks instead.
 * @see https://dove.feathersjs.com/guides/cli/service.schemas.html
 */
export declare const resolveAll: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(map: ResolveAllSettings<H>) => (this: any, context: H, next?: import("@feathersjs/hooks").AsyncMiddleware<H>) => Promise<any>;
export {};
