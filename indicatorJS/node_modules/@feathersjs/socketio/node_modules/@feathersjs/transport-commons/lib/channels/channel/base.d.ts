/// <reference types="node" />
import { EventEmitter } from 'events';
export interface RealTimeConnection {
    [key: string]: any;
}
export declare class Channel extends EventEmitter {
    connections: RealTimeConnection[];
    data: any;
    constructor(connections?: RealTimeConnection[], data?: any);
    get length(): number;
    leave(...connections: RealTimeConnection[]): this;
    join(...connections: RealTimeConnection[]): this;
    filter(fn: (connection: RealTimeConnection) => boolean): Channel;
    send(data: any): Channel;
}
