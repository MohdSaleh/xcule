import { AuthenticationStrategy, AuthenticationBase } from './core';
import { Application, Service } from '@feathersjs/feathers';
export declare class AuthenticationBaseStrategy implements AuthenticationStrategy {
    authentication?: AuthenticationBase;
    app?: Application;
    name?: string;
    setAuthentication(auth: AuthenticationBase): void;
    setApplication(app: Application): void;
    setName(name: string): void;
    get configuration(): any;
    get entityService(): Service;
}
