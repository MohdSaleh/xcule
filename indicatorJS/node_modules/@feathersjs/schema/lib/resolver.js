"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = exports.Resolver = exports.virtual = exports.IS_VIRTUAL = void 0;
const errors_1 = require("@feathersjs/errors");
exports.IS_VIRTUAL = Symbol.for('@feathersjs/schema/virtual');
/**
 * Create a resolver for a virtual property. A virtual property is a property that
 * is computed and never has an initial value.
 *
 * @param virtualResolver The virtual resolver function
 * @returns The property resolver function
 */
const virtual = (virtualResolver) => {
    const propertyResolver = async (_value, obj, context, status) => virtualResolver(obj, context, status);
    propertyResolver[exports.IS_VIRTUAL] = true;
    return propertyResolver;
};
exports.virtual = virtual;
class Resolver {
    constructor(options) {
        this.options = options;
        this.propertyNames = Object.keys(options.properties);
        this.virtualNames = this.propertyNames.filter((name) => options.properties[name][exports.IS_VIRTUAL]);
    }
    /**
     * Resolve a single property
     *
     * @param name The name of the property
     * @param data The current data
     * @param context The current resolver context
     * @param status The current resolver status
     * @returns The resolver property
     */
    async resolveProperty(name, data, context, status = {}) {
        const resolver = this.options.properties[name];
        const value = data[name];
        const { path = [], stack = [] } = status || {};
        // This prevents circular dependencies
        if (stack.includes(resolver)) {
            return undefined;
        }
        const resolverStatus = {
            ...status,
            path: [...path, name],
            stack: [...stack, resolver]
        };
        return resolver(value, data, context, resolverStatus);
    }
    async convert(data, context, status) {
        if (this.options.converter) {
            const { path = [], stack = [] } = status || {};
            return this.options.converter(data, context, { ...status, path, stack });
        }
        return data;
    }
    async resolve(_data, context, status) {
        const { properties: resolvers, schema, validate } = this.options;
        const payload = await this.convert(_data, context, status);
        if (!Array.isArray(status === null || status === void 0 ? void 0 : status.properties) && this.propertyNames.length === 0) {
            return payload;
        }
        const data = schema && validate === 'before' ? await schema.validate(payload) : payload;
        const propertyList = (Array.isArray(status === null || status === void 0 ? void 0 : status.properties)
            ? status === null || status === void 0 ? void 0 : status.properties
            : // By default get all data and resolver keys but remove duplicates
                [...new Set(Object.keys(data).concat(this.propertyNames))]);
        const result = {};
        const errors = {};
        let hasErrors = false;
        // Not the most elegant but better performance
        await Promise.all(propertyList.map(async (name) => {
            const value = data[name];
            if (resolvers[name]) {
                try {
                    const resolved = await this.resolveProperty(name, data, context, status);
                    if (resolved !== undefined) {
                        result[name] = resolved;
                    }
                }
                catch (error) {
                    // TODO add error stacks
                    const convertedError = typeof error.toJSON === 'function' ? error.toJSON() : { message: error.message || error };
                    errors[name] = convertedError;
                    hasErrors = true;
                }
            }
            else if (value !== undefined) {
                result[name] = value;
            }
        }));
        if (hasErrors) {
            const propertyName = (status === null || status === void 0 ? void 0 : status.properties) ? ` ${status.properties.join('.')}` : '';
            throw new errors_1.BadRequest('Error resolving data' + (propertyName ? ` ${propertyName}` : ''), errors);
        }
        return schema && validate === 'after' ? await schema.validate(result) : result;
    }
}
exports.Resolver = Resolver;
function resolve(properties, options) {
    const settings = (properties.properties ? properties : { properties, ...options });
    return new Resolver(settings);
}
exports.resolve = resolve;
//# sourceMappingURL=resolver.js.map