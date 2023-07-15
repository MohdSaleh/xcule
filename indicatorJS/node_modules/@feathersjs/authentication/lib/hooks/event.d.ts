import { HookContext, NextFunction } from '@feathersjs/feathers';
import { ConnectionEvent } from '../core';
declare const _default: (event: ConnectionEvent) => (context: HookContext, next: NextFunction) => Promise<void>;
export default _default;
