"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const errors_1 = require("@feathersjs/errors");
const commons_1 = require("@feathersjs/commons");
const debug = (0, commons_1.createDebug)('@feathersjs/transport-commons/client');
const namespacedEmitterMethods = [
    'addListener',
    'addEventListener',
    'emit',
    'listenerCount',
    'listeners',
    'on',
    'once',
    'prependListener',
    'prependOnceListener',
    'removeAllListeners',
    'removeEventListener',
    'removeListener'
];
const otherEmitterMethods = ['eventNames', 'getMaxListeners', 'setMaxListeners'];
const addEmitterMethods = (service) => {
    otherEmitterMethods.forEach((method) => {
        service[method] = function (...args) {
            if (typeof this.connection[method] !== 'function') {
                throw new Error(`Can not call '${method}' on the client service connection`);
            }
            return this.connection[method](...args);
        };
    });
    // Methods that should add the namespace (service path)
    namespacedEmitterMethods.forEach((method) => {
        service[method] = function (name, ...args) {
            if (typeof this.connection[method] !== 'function') {
                throw new Error(`Can not call '${method}' on the client service connection`);
            }
            const eventName = `${this.path} ${name}`;
            debug(`Calling emitter method ${method} with ` + `namespaced event '${eventName}'`);
            const result = this.connection[method](eventName, ...args);
            return result === this.connection ? this : result;
        };
    });
};
class Service {
    constructor(options) {
        this.events = options.events;
        this.path = options.name;
        this.connection = options.connection;
        this.method = options.method;
        addEmitterMethods(this);
    }
    send(method, ...args) {
        return new Promise((resolve, reject) => {
            args.unshift(method, this.path);
            args.push(function (error, data) {
                return error ? reject((0, errors_1.convert)(error)) : resolve(data);
            });
            debug(`Sending socket.${this.method}`, args);
            this.connection[this.method](...args);
        });
    }
    methods(...names) {
        names.forEach((name) => {
            this[name] = function (data, params = {}) {
                return this.send(name, data, params.query || {});
            };
        });
        return this;
    }
    find(params = {}) {
        return this.send('find', params.query || {});
    }
    get(id, params = {}) {
        return this.send('get', id, params.query || {});
    }
    create(data, params = {}) {
        return this.send('create', data, params.query || {});
    }
    update(id, data, params = {}) {
        return this.send('update', id, data, params.query || {});
    }
    patch(id, data, params = {}) {
        return this.send('patch', id, data, params.query || {});
    }
    remove(id, params = {}) {
        return this.send('remove', id, params.query || {});
    }
    // `off` is actually not part of the Node event emitter spec
    // but we are adding it since everybody is expecting it because
    // of the emitter-component Socket.io is using
    off(name, ...args) {
        if (typeof this.connection.off === 'function') {
            const result = this.connection.off(`${this.path} ${name}`, ...args);
            return result === this.connection ? this : result;
        }
        else if (args.length === 0) {
            // @ts-ignore
            return this.removeAllListeners(name);
        }
        // @ts-ignore
        return this.removeListener(name, ...args);
    }
}
exports.Service = Service;
//# sourceMappingURL=client.js.map