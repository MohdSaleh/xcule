"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationBaseStrategy = void 0;
class AuthenticationBaseStrategy {
    setAuthentication(auth) {
        this.authentication = auth;
    }
    setApplication(app) {
        this.app = app;
    }
    setName(name) {
        this.name = name;
    }
    get configuration() {
        return this.authentication.configuration[this.name];
    }
    get entityService() {
        const { service } = this.configuration;
        if (!service) {
            return null;
        }
        return this.app.service(service) || null;
    }
}
exports.AuthenticationBaseStrategy = AuthenticationBaseStrategy;
//# sourceMappingURL=strategy.js.map