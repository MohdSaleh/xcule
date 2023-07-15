"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.SchemaWrapper = exports.Ajv = exports.DEFAULT_AJV = void 0;
const ajv_1 = __importDefault(require("ajv"));
exports.Ajv = ajv_1.default;
const errors_1 = require("@feathersjs/errors");
exports.DEFAULT_AJV = new ajv_1.default({
    coerceTypes: true,
    addUsedSchema: false
});
class SchemaWrapper {
    constructor(definition, ajv = exports.DEFAULT_AJV) {
        this.definition = definition;
        this.ajv = ajv;
        this.validator = this.ajv.compile({
            $async: true,
            ...this.definition
        });
    }
    get properties() {
        return this.definition.properties;
    }
    get required() {
        return this.definition.required;
    }
    async validate(...args) {
        try {
            const validated = (await this.validator(...args));
            return validated;
        }
        catch (error) {
            throw new errors_1.BadRequest(error.message, error.errors);
        }
    }
    toJSON() {
        return this.definition;
    }
}
exports.SchemaWrapper = SchemaWrapper;
function schema(definition, ajv = exports.DEFAULT_AJV) {
    return new SchemaWrapper(definition, ajv);
}
exports.schema = schema;
//# sourceMappingURL=schema.js.map