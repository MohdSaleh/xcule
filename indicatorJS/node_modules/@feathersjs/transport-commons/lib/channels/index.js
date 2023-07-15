"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombinedChannel = exports.Channel = exports.channels = exports.keys = void 0;
const feathers_1 = require("@feathersjs/feathers");
const commons_1 = require("@feathersjs/commons");
const lodash_1 = require("lodash");
const base_1 = require("./channel/base");
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return base_1.Channel; } });
const combined_1 = require("./channel/combined");
Object.defineProperty(exports, "CombinedChannel", { enumerable: true, get: function () { return combined_1.CombinedChannel; } });
const mixins_1 = require("./mixins");
Object.defineProperty(exports, "keys", { enumerable: true, get: function () { return mixins_1.keys; } });
const debug = (0, commons_1.createDebug)('@feathersjs/transport-commons/channels');
const { CHANNELS } = mixins_1.keys;
function channels() {
    return (app) => {
        if (typeof app.channel === 'function' && typeof app.publish === 'function') {
            return;
        }
        Object.assign(app, (0, mixins_1.channelMixin)(), (0, mixins_1.publishMixin)());
        Object.defineProperty(app, 'channels', {
            get() {
                return Object.keys(this[CHANNELS]);
            }
        });
        app.mixins.push((service, path) => {
            const { serviceEvents } = (0, feathers_1.getServiceOptions)(service);
            if (typeof service.publish === 'function') {
                return;
            }
            Object.assign(service, (0, mixins_1.publishMixin)());
            serviceEvents.forEach((event) => {
                service.on(event, function (data, hook) {
                    if (!hook) {
                        // Fake hook for custom events
                        hook = { path, service, app, result: data };
                    }
                    debug('Publishing event', event, hook.path);
                    const logError = (error) => debug(`Error in '${hook.path} ${event}' publisher`, error);
                    const servicePublishers = service[mixins_1.keys.PUBLISHERS];
                    const appPublishers = app[mixins_1.keys.PUBLISHERS];
                    // This will return the first publisher list that is not empty
                    // In the following precedence
                    const publisher = 
                    // 1. Service publisher for a specific event
                    servicePublishers[event] ||
                        // 2. Service publisher for all events
                        servicePublishers[mixins_1.keys.ALL_EVENTS] ||
                        // 3. App publisher for a specific event
                        appPublishers[event] ||
                        // 4. App publisher for all events
                        appPublishers[mixins_1.keys.ALL_EVENTS] ||
                        // 5. No publisher
                        lodash_1.noop;
                    try {
                        Promise.resolve(publisher(data, hook))
                            .then((result) => {
                            if (!result) {
                                return;
                            }
                            const results = Array.isArray(result) ? (0, lodash_1.compact)((0, lodash_1.flattenDeep)(result)) : [result];
                            const channel = new combined_1.CombinedChannel(results);
                            if (channel && channel.length > 0) {
                                app.emit('publish', event, channel, hook, data);
                            }
                            else {
                                debug('No connections to publish to');
                            }
                        })
                            .catch(logError);
                    }
                    catch (error) {
                        logError(error);
                    }
                });
            });
        });
    };
}
exports.channels = channels;
//# sourceMappingURL=index.js.map