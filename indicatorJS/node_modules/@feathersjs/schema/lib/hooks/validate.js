"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = exports.validateQuery = void 0;
const errors_1 = require("@feathersjs/errors");
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const validateQuery = (schema) => {
    const validator = typeof schema === 'function' ? schema : schema.validate.bind(schema);
    return async (context, next) => {
        var _a;
        const data = ((_a = context === null || context === void 0 ? void 0 : context.params) === null || _a === void 0 ? void 0 : _a.query) || {};
        try {
            const query = await validator(data);
            Object.defineProperty(query, adapter_commons_1.VALIDATED, { value: true });
            context.params = {
                ...context.params,
                query
            };
        }
        catch (error) {
            throw error.ajv ? new errors_1.BadRequest(error.message, error.errors) : error;
        }
        if (typeof next === 'function') {
            return next();
        }
    };
};
exports.validateQuery = validateQuery;
const validateData = (schema) => {
    return async (context, next) => {
        const data = context.data;
        const validator = typeof schema.validate === 'function'
            ? schema.validate.bind(schema)
            : typeof schema === 'function'
                ? schema
                : schema[context.method];
        if (validator) {
            try {
                if (Array.isArray(data)) {
                    context.data = await Promise.all(data.map((current) => validator(current)));
                }
                else {
                    context.data = await validator(data);
                }
                Object.defineProperty(context.data, adapter_commons_1.VALIDATED, { value: true });
            }
            catch (error) {
                throw error.ajv ? new errors_1.BadRequest(error.message, error.errors) : error;
            }
        }
        if (typeof next === 'function') {
            return next();
        }
    };
};
exports.validateData = validateData;
//# sourceMappingURL=validate.js.map