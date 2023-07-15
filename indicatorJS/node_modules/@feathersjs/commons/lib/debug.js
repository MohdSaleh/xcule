"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDebug = exports.setDebug = exports.noopDebug = void 0;
const debuggers = {};
function noopDebug() {
    return function () { };
}
exports.noopDebug = noopDebug;
let defaultInitializer = noopDebug;
function setDebug(debug) {
    defaultInitializer = debug;
    Object.keys(debuggers).forEach((name) => {
        debuggers[name] = debug(name);
    });
}
exports.setDebug = setDebug;
function createDebug(name) {
    if (!debuggers[name]) {
        debuggers[name] = defaultInitializer(name);
    }
    return (...args) => debuggers[name](...args);
}
exports.createDebug = createDebug;
//# sourceMappingURL=debug.js.map