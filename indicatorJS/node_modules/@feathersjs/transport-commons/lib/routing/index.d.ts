import { Application } from '@feathersjs/feathers';
import { Router } from './router';
declare module '@feathersjs/feathers/lib/declarations' {
    interface RouteLookup {
        service: Service;
        params: {
            [key: string]: any;
        };
    }
    interface Application<Services, Settings> {
        routes: Router<{
            service: Service;
            params?: {
                [key: string]: any;
            };
        }>;
        lookup(path: string): RouteLookup;
    }
}
export * from './router';
export declare const routing: () => (app: Application) => void;
