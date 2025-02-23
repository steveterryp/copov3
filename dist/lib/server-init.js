var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { logger } from './logger';
import { dbInit } from './db-init';
import { config } from './config';
import { checkDatabaseConnection } from './prisma';
var ServerInitializer = /** @class */ (function () {
    function ServerInitializer() {
        var _this = this;
        this.isInitialized = false;
        this.shutdownCallbacks = [];
        // Register shutdown handlers
        process.on('SIGTERM', function () { return _this.handleShutdown('SIGTERM'); });
        process.on('SIGINT', function () { return _this.handleShutdown('SIGINT'); });
        process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
        process.on('uncaughtException', this.handleUncaughtException.bind(this));
    }
    ServerInitializer.getInstance = function () {
        if (!ServerInitializer.instance) {
            ServerInitializer.instance = new ServerInitializer();
        }
        return ServerInitializer.instance;
    };
    /**
     * Initialize the server and all its dependencies
     */
    ServerInitializer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, duration, error_1, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized) {
                            logger.warn('Server already initialized');
                            return [2 /*return*/];
                        }
                        startTime = Date.now();
                        logger.info('Starting server initialization', {
                            environment: config.env.isDevelopment ? 'development' : 'production',
                            nodeVersion: process.version,
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Initialize components in sequence
                        return [4 /*yield*/, this.initializeDatabase()];
                    case 2:
                        // Initialize components in sequence
                        _a.sent();
                        return [4 /*yield*/, this.validateEnvironment()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.initializeServices()];
                    case 4:
                        _a.sent();
                        duration = Date.now() - startTime;
                        logger.info('Server initialization completed', {
                            duration: "".concat(duration, "ms"),
                        });
                        this.isInitialized = true;
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        duration = Date.now() - startTime;
                        logger.error('Server initialization failed', {
                            duration: "".concat(duration, "ms"),
                        }, error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize database connection
     */
    ServerInitializer.prototype.initializeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info('Initializing database');
                        return [4 /*yield*/, dbInit.initialize()];
                    case 1:
                        _a.sent();
                        // Register database cleanup
                        this.registerShutdownCallback(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, dbInit.cleanup()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate environment configuration
     */
    ServerInitializer.prototype.validateEnvironment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var requiredEnvVars, missingVars;
            return __generator(this, function (_a) {
                logger.info('Validating environment configuration');
                requiredEnvVars = [
                    'DATABASE_URL',
                    'JWT_ACCESS_SECRET',
                    'JWT_REFRESH_SECRET',
                    'NEXTAUTH_URL',
                    'NEXTAUTH_SECRET',
                ];
                missingVars = requiredEnvVars.filter(function (envVar) { return !process.env[envVar]; });
                if (missingVars.length > 0) {
                    throw new Error("Missing required environment variables: ".concat(missingVars.join(', ')));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Initialize additional services
     */
    ServerInitializer.prototype.initializeServices = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger.info('Initializing services');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Register a callback to be executed during shutdown
     */
    ServerInitializer.prototype.registerShutdownCallback = function (callback) {
        this.shutdownCallbacks.push(callback);
    };
    /**
     * Handle graceful shutdown
     */
    ServerInitializer.prototype.handleShutdown = function (signal) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, callback, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.info("".concat(signal, " received, starting graceful shutdown"));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        _i = 0, _a = this.shutdownCallbacks.reverse();
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        callback = _a[_i];
                        return [4 /*yield*/, callback()];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        logger.info('Graceful shutdown completed');
                        process.exit(0);
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _b.sent();
                        logger.error('Error during shutdown', {
                            signal: signal,
                        }, error_2 instanceof Error ? error_2 : new Error('Unknown error'));
                        process.exit(1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle unhandled promise rejections
     */
    ServerInitializer.prototype.handleUnhandledRejection = function (reason, promise) {
        logger.error('Unhandled Promise Rejection', {
            promise: promise.toString(),
        }, reason instanceof Error ? reason : new Error('Unknown error'));
    };
    /**
     * Handle uncaught exceptions
     */
    ServerInitializer.prototype.handleUncaughtException = function (error) {
        logger.error('Uncaught Exception', {}, error);
        // Perform graceful shutdown after uncaught exception
        this.handleShutdown('UNCAUGHT_EXCEPTION');
    };
    /**
     * Check server health
     */
    ServerInitializer.prototype.checkHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var details, _a, healthy;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        details = {};
                        // Check database connection
                        _a = details;
                        return [4 /*yield*/, checkDatabaseConnection()];
                    case 1:
                        // Check database connection
                        _a.database = _b.sent();
                        healthy = Object.values(details).every(Boolean);
                        return [2 /*return*/, { healthy: healthy, details: details }];
                }
            });
        });
    };
    return ServerInitializer;
}());
export { ServerInitializer };
// Export singleton instance
export var serverInit = ServerInitializer.getInstance();
