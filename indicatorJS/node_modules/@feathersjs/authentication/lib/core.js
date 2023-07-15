"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationBase = void 0;
const merge_1 = __importDefault(require("lodash/merge"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const errors_1 = require("@feathersjs/errors");
const commons_1 = require("@feathersjs/commons");
const options_1 = require("./options");
const debug = (0, commons_1.createDebug)('@feathersjs/authentication/base');
/**
 * A base class for managing authentication strategies and creating and verifying JWTs
 */
class AuthenticationBase {
    /**
     * Create a new authentication service.
     *
     * @param app The Feathers application instance
     * @param configKey The configuration key name in `app.get` (default: `authentication`)
     * @param options Optional initial options
     */
    constructor(app, configKey = 'authentication', options = {}) {
        if (!app || typeof app.use !== 'function') {
            throw new Error('An application instance has to be passed to the authentication service');
        }
        this.app = app;
        this.strategies = {};
        this.configKey = configKey;
        this.isReady = false;
        app.set('defaultAuthentication', app.get('defaultAuthentication') || configKey);
        app.set(configKey, (0, merge_1.default)({}, app.get(configKey), options));
    }
    /**
     * Return the current configuration from the application
     */
    get configuration() {
        // Always returns a copy of the authentication configuration
        return Object.assign({}, options_1.defaultOptions, this.app.get(this.configKey));
    }
    /**
     * A list of all registered strategy names
     */
    get strategyNames() {
        return Object.keys(this.strategies);
    }
    /**
     * Register a new authentication strategy under a given name.
     *
     * @param name The name to register the strategy under
     * @param strategy The authentication strategy instance
     */
    register(name, strategy) {
        var _a;
        // Call the functions a strategy can implement
        if (typeof strategy.setName === 'function') {
            strategy.setName(name);
        }
        if (typeof strategy.setApplication === 'function') {
            strategy.setApplication(this.app);
        }
        if (typeof strategy.setAuthentication === 'function') {
            strategy.setAuthentication(this);
        }
        if (typeof strategy.verifyConfiguration === 'function') {
            strategy.verifyConfiguration();
        }
        // Register strategy as name
        this.strategies[name] = strategy;
        if (this.isReady) {
            (_a = strategy.setup) === null || _a === void 0 ? void 0 : _a.call(strategy, this, name);
        }
    }
    /**
     * Get the registered authentication strategies for a list of names.
     *
     * @param names The list or strategy names
     */
    getStrategies(...names) {
        return names.map((name) => this.strategies[name]).filter((current) => !!current);
    }
    /**
     * Returns a single strategy by name
     *
     * @param name The strategy name
     * @returns The authentication strategy or undefined
     */
    getStrategy(name) {
        return this.strategies[name];
    }
    /**
     * Create a new access token with payload and options.
     *
     * @param payload The JWT payload
     * @param optsOverride The options to extend the defaults (`configuration.jwtOptions`) with
     * @param secretOverride Use a different secret instead
     */
    async createAccessToken(payload, optsOverride, secretOverride) {
        const { secret, jwtOptions } = this.configuration;
        // Use configuration by default but allow overriding the secret
        const jwtSecret = secretOverride || secret;
        // Default jwt options merged with additional options
        const options = (0, merge_1.default)({}, jwtOptions, optsOverride);
        if (!options.jwtid) {
            // Generate a UUID as JWT ID by default
            options.jwtid = (0, uuid_1.v4)();
        }
        return jsonwebtoken_1.default.sign(payload, jwtSecret, options);
    }
    /**
     * Verifies an access token.
     *
     * @param accessToken The token to verify
     * @param optsOverride The options to extend the defaults (`configuration.jwtOptions`) with
     * @param secretOverride Use a different secret instead
     */
    async verifyAccessToken(accessToken, optsOverride, secretOverride) {
        const { secret, jwtOptions } = this.configuration;
        const jwtSecret = secretOverride || secret;
        const options = (0, merge_1.default)({}, jwtOptions, optsOverride);
        const { algorithm } = options;
        // Normalize the `algorithm` setting into the algorithms array
        if (algorithm && !options.algorithms) {
            options.algorithms = (Array.isArray(algorithm) ? algorithm : [algorithm]);
            delete options.algorithm;
        }
        try {
            const verified = jsonwebtoken_1.default.verify(accessToken, jwtSecret, options);
            return verified;
        }
        catch (error) {
            throw new errors_1.NotAuthenticated(error.message, error);
        }
    }
    /**
     * Authenticate a given authentication request against a list of strategies.
     *
     * @param authentication The authentication request
     * @param params Service call parameters
     * @param allowed A list of allowed strategy names
     */
    async authenticate(authentication, params, ...allowed) {
        const { strategy } = authentication || {};
        const [authStrategy] = this.getStrategies(strategy);
        const strategyAllowed = allowed.includes(strategy);
        debug('Running authenticate for strategy', strategy, allowed);
        if (!authentication || !authStrategy || !strategyAllowed) {
            const additionalInfo = (!strategy && ' (no `strategy` set)') ||
                (!strategyAllowed && ' (strategy not allowed in authStrategies)') ||
                '';
            // If there are no valid strategies or `authentication` is not an object
            throw new errors_1.NotAuthenticated('Invalid authentication information' + additionalInfo);
        }
        return authStrategy.authenticate(authentication, {
            ...params,
            authenticated: true
        });
    }
    async handleConnection(event, connection, authResult) {
        const strategies = this.getStrategies(...Object.keys(this.strategies)).filter((current) => typeof current.handleConnection === 'function');
        for (const strategy of strategies) {
            await strategy.handleConnection(event, connection, authResult);
        }
    }
    /**
     * Parse an HTTP request and response for authentication request information.
     *
     * @param req The HTTP request
     * @param res The HTTP response
     * @param names A list of strategies to use
     */
    async parse(req, res, ...names) {
        const strategies = this.getStrategies(...names).filter((current) => typeof current.parse === 'function');
        debug('Strategies parsing HTTP header for authentication information', names);
        for (const authStrategy of strategies) {
            const value = await authStrategy.parse(req, res);
            if (value !== null) {
                return value;
            }
        }
        return null;
    }
    async setup() {
        var _a;
        this.isReady = true;
        for (const name of Object.keys(this.strategies)) {
            const strategy = this.strategies[name];
            await ((_a = strategy.setup) === null || _a === void 0 ? void 0 : _a.call(strategy, this, name));
        }
    }
}
exports.AuthenticationBase = AuthenticationBase;
//# sourceMappingURL=core.js.map