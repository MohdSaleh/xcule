import { Channel, RealTimeConnection } from './base';
export declare class CombinedChannel extends Channel {
    children: Channel[];
    mappings: WeakMap<RealTimeConnection, any>;
    constructor(children: Channel[], data?: any);
    refresh(): this & {
        connections: RealTimeConnection[];
        mappings: WeakMap<RealTimeConnection, any>;
    };
    leave(...connections: RealTimeConnection[]): this;
    join(...connections: RealTimeConnection[]): this;
    dataFor(connection: RealTimeConnection): any;
    private callChildren;
}
