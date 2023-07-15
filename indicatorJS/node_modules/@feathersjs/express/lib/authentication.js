"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.parseAuthentication = void 0;
const commons_1 = require("@feathersjs/commons");
const authentication_1 = require("@feathersjs/authentication");
const debug = (0, commons_1.createDebug)('@feathersjs/express/authentication');
const toHandler = (func) => {
    return (req, res, next) => func(req, res, next).catch((error) => next(error));
};
function parseAuthentication(settings = {}) {
    return toHandler(async (req, res, next) => {
        var _a;
        const app = req.app;
        const service = (_a = app.defaultAuthentication) === null || _a === void 0 ? void 0 : _a.call(app, settings.service);
        if (!service) {
            return next();
        }
        const config = service.configuration;
        const authStrategies = settings.strategies || config.parseStrategies || config.authStrategies || [];
        if (authStrategies.length === 0) {
            debug('No `authStrategies` or `parseStrategies` found in authentication configuration');
            return next();
        }
        const authentication = await service.parse(req, res, ...authStrategies);
        if (authentication) {
            debug('Parsed authentication from HTTP header', authentication);
            req.feathers = { ...req.feathers, authentication };
        }
        return next();
    });
}
exports.parseAuthentication = parseAuthentication;
function authenticate(settings, ...strategies) {
    const hook = (0, authentication_1.authenticate)(settings, ...strategies);
    return toHandler(async (req, _res, next) => {
        const app = req.app;
        const params = req.feathers;
        const context = { app, params };
        await hook(context);
        req.feathers = context.params;
        return next();
    });
}
exports.authenticate = authenticate;
//# sourceMappingURL=authentication.js.map