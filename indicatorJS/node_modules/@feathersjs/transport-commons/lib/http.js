"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = exports.getStatusCode = exports.argumentsFor = exports.getServiceMethod = exports.knownMethods = exports.statusCodes = exports.METHOD_HEADER = void 0;
const lib_1 = require("@feathersjs/errors/lib");
const encodeurl_1 = __importDefault(require("encodeurl"));
exports.METHOD_HEADER = 'x-service-method';
exports.statusCodes = {
    created: 201,
    noContent: 204,
    methodNotAllowed: 405,
    success: 200,
    seeOther: 303
};
exports.knownMethods = {
    post: 'create',
    patch: 'patch',
    put: 'update',
    delete: 'remove'
};
function getServiceMethod(_httpMethod, id, headerOverride) {
    const httpMethod = _httpMethod.toLowerCase();
    if (httpMethod === 'post' && headerOverride) {
        return headerOverride;
    }
    const mappedMethod = exports.knownMethods[httpMethod];
    if (mappedMethod) {
        return mappedMethod;
    }
    if (httpMethod === 'get') {
        return id === null ? 'find' : 'get';
    }
    throw new lib_1.MethodNotAllowed(`Method ${_httpMethod} not allowed`);
}
exports.getServiceMethod = getServiceMethod;
exports.argumentsFor = {
    get: ({ id, params }) => [id, params],
    find: ({ params }) => [params],
    create: ({ data, params }) => [data, params],
    update: ({ id, data, params }) => [id, data, params],
    patch: ({ id, data, params }) => [id, data, params],
    remove: ({ id, params }) => [id, params],
    default: ({ data, params }) => [data, params]
};
function getStatusCode(context, body, location) {
    const { http = {} } = context;
    if (http.status) {
        return http.status;
    }
    if (context.method === 'create') {
        return exports.statusCodes.created;
    }
    if (location !== undefined) {
        return exports.statusCodes.seeOther;
    }
    if (!body) {
        return exports.statusCodes.noContent;
    }
    return exports.statusCodes.success;
}
exports.getStatusCode = getStatusCode;
function getResponse(context) {
    const { http = {} } = context;
    const body = context.dispatch !== undefined ? context.dispatch : context.result;
    let headers = http.headers || {};
    let location = headers.Location;
    if (http.location !== undefined) {
        location = (0, encodeurl_1.default)(http.location);
        headers = { ...headers, Location: location };
    }
    const status = getStatusCode(context, body, location);
    return { status, headers, body };
}
exports.getResponse = getResponse;
//# sourceMappingURL=http.js.map