"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commons_1 = require("@feathersjs/commons");
const debug = (0, commons_1.createDebug)('@feathersjs/authentication/hooks/connection');
exports.default = (event) => async (context, next) => {
    await next();
    const { app, result, params } = context;
    if (params.provider && result) {
        debug(`Sending authentication event '${event}'`);
        app.emit(event, result, params, context);
    }
};
//# sourceMappingURL=event.js.map