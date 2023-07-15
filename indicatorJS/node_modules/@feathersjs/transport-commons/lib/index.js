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
exports.CombinedChannel = exports.Channel = exports.channels = exports.routing = exports.socket = exports.http = void 0;
const socket_1 = require("./socket");
Object.defineProperty(exports, "socket", { enumerable: true, get: function () { return socket_1.socket; } });
const routing_1 = require("./routing");
Object.defineProperty(exports, "routing", { enumerable: true, get: function () { return routing_1.routing; } });
const channels_1 = require("./channels");
Object.defineProperty(exports, "channels", { enumerable: true, get: function () { return channels_1.channels; } });
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return channels_1.Channel; } });
Object.defineProperty(exports, "CombinedChannel", { enumerable: true, get: function () { return channels_1.CombinedChannel; } });
exports.http = __importStar(require("./http"));
//# sourceMappingURL=index.js.map