import { Application } from '@feathersjs/feathers';
import { RealTimeConnection } from '../channels/channel/base';
export interface SocketOptions {
    done: Promise<any>;
    emit: string;
    socketMap: WeakMap<RealTimeConnection, any>;
    socketKey?: any;
    getParams: (socket: any) => RealTimeConnection;
}
export declare function socket({ done, emit, socketMap, socketKey, getParams }: SocketOptions): (app: Application) => void;
