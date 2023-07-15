"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const feathers_1 = require("@feathersjs/feathers");
const commons_1 = require("@feathersjs/commons");
const channels_1 = require("../channels");
const routing_1 = require("../routing");
const utils_1 = require("./utils");
const debug = (0, commons_1.createDebug)('@feathersjs/transport-commons');
function socket({ done, emit, socketMap, socketKey, getParams }) {
    return (app) => {
        const leaveChannels = (connection) => {
            const { channels } = app;
            if (channels.length) {
                app.channel(app.channels).leave(connection);
            }
        };
        app.configure((0, channels_1.channels)());
        app.configure((0, routing_1.routing)());
        app.on('publish', (0, utils_1.getDispatcher)(emit, socketMap, socketKey));
        app.on('disconnect', leaveChannels);
        app.on('logout', (_authResult, params) => {
            const { connection } = params;
            if (connection) {
                leaveChannels(connection);
            }
        });
        // `connection` event
        done.then((provider) => provider.on('connection', (connection) => app.emit('connection', getParams(connection))));
        // `socket.emit('methodName', 'serviceName', ...args)` handlers
        done.then((provider) => provider.on('connection', (connection) => {
            const methodHandlers = Object.keys(app.services).reduce((result, name) => {
                const { methods } = (0, feathers_1.getServiceOptions)(app.service(name));
                methods.forEach((method) => {
                    if (!result[method]) {
                        result[method] = (...args) => {
                            const path = args.shift();
                            debug(`Got '${method}' call for service '${path}'`);
                            (0, utils_1.runMethod)(app, getParams(connection), path, method, args);
                        };
                    }
                });
                return result;
            }, {});
            Object.keys(methodHandlers).forEach((key) => connection.on(key, methodHandlers[key]));
        }));
    };
}
exports.socket = socket;
//# sourceMappingURL=index.js.map