"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationSettingsSchema = exports.JWTStrategy = exports.AuthenticationService = exports.AuthenticationBaseStrategy = exports.AuthenticationBase = exports.authenticate = exports.hooks = void 0;
exports.hooks = __importStar(require("./hooks"));
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return hooks_1.authenticate; } });
var core_1 = require("./core");
Object.defineProperty(exports, "AuthenticationBase", { enumerable: true, get: function () { return core_1.AuthenticationBase; } });
var strategy_1 = require("./strategy");
Object.defineProperty(exports, "AuthenticationBaseStrategy", { enumerable: true, get: function () { return strategy_1.AuthenticationBaseStrategy; } });
var service_1 = require("./service");
Object.defineProperty(exports, "AuthenticationService", { enumerable: true, get: function () { return service_1.AuthenticationService; } });
var jwt_1 = require("./jwt");
Object.defineProperty(exports, "JWTStrategy", { enumerable: true, get: function () { return jwt_1.JWTStrategy; } });
var options_1 = require("./options");
Object.defineProperty(exports, "authenticationSettingsSchema", { enumerable: true, get: function () { return options_1.authenticationSettingsSchema; } });
//# sourceMappingURL=index.js.map