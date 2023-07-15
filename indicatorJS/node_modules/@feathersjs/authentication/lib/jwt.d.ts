/// <reference types="node" />
import { IncomingMessage } from 'http';
import { Params } from '@feathersjs/feathers';
import { AuthenticationBaseStrategy } from './strategy';
import { AuthenticationParams, AuthenticationRequest, AuthenticationResult, ConnectionEvent } from './core';
export declare class JWTStrategy extends AuthenticationBaseStrategy {
    expirationTimers: WeakMap<object, any>;
    get configuration(): any;
    handleConnection(event: ConnectionEvent, connection: any, authResult?: AuthenticationResult): Promise<void>;
    verifyConfiguration(): void;
    getEntityQuery(_params: Params): Promise<{}>;
    /**
     * Return the entity for a given id
     *
     * @param id The id to use
     * @param params Service call parameters
     */
    getEntity(id: string, params: Params): Promise<any>;
    getEntityId(authResult: AuthenticationResult, _params: Params): Promise<any>;
    authenticate(authentication: AuthenticationRequest, params: AuthenticationParams): Promise<{
        accessToken: any;
        authentication: {
            strategy: string;
            accessToken: any;
            payload: any;
        };
    }>;
    parse(req: IncomingMessage): Promise<{
        strategy: string;
        accessToken: string;
    } | null>;
}
