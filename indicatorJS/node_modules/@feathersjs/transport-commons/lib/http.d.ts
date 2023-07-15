import { HookContext, NullableId, Params } from '@feathersjs/feathers';
export declare const METHOD_HEADER = "x-service-method";
export interface ServiceParams {
    id: NullableId;
    data: any;
    params: Params;
}
export declare const statusCodes: {
    created: number;
    noContent: number;
    methodNotAllowed: number;
    success: number;
    seeOther: number;
};
export declare const knownMethods: {
    [key: string]: string;
};
export declare function getServiceMethod(_httpMethod: string, id: unknown, headerOverride?: string): string;
export declare const argumentsFor: {
    get: ({ id, params }: ServiceParams) => (Params<import("@feathersjs/feathers").Query> | NullableId)[];
    find: ({ params }: ServiceParams) => Params<import("@feathersjs/feathers").Query>[];
    create: ({ data, params }: ServiceParams) => any[];
    update: ({ id, data, params }: ServiceParams) => any[];
    patch: ({ id, data, params }: ServiceParams) => any[];
    remove: ({ id, params }: ServiceParams) => (Params<import("@feathersjs/feathers").Query> | NullableId)[];
    default: ({ data, params }: ServiceParams) => any[];
};
export declare function getStatusCode(context: HookContext, body: any, location: string | string[]): number;
export declare function getResponse(context: HookContext): {
    status: number;
    headers: {
        [key: string]: string | string[];
    };
    body: any;
};
