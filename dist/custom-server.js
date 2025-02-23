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
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { logger } from './lib/logger';
import { serverInit } from './lib/server-init';
import { config } from './lib/config';
var NextServerBootstrap = /** @class */ (function () {
    function NextServerBootstrap() {
    }
    /**
     * Start the Next.js server with our custom initialization
     */
    NextServerBootstrap.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, dev, hostname_1, port_1, app, handle_1, error_1, duration;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isStarting) {
                            logger.warn('Server startup already in progress');
                            return [2 /*return*/];
                        }
                        this.isStarting = true;
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        dev = config.env.isDevelopment;
                        hostname_1 = process.env.HOSTNAME || 'localhost';
                        port_1 = parseInt(process.env.PORT || '3000', 10);
                        logger.info('Initializing Next.js server', {
                            dev: dev,
                            hostname: hostname_1,
                            port: port_1,
                        });
                        app = next({ dev: dev, hostname: hostname_1, port: port_1 });
                        handle_1 = app.getRequestHandler();
                        // Prepare Next.js
                        return [4 /*yield*/, app.prepare()];
                    case 2:
                        // Prepare Next.js
                        _a.sent();
                        // Initialize our server components
                        return [4 /*yield*/, serverInit.initialize()];
                    case 3:
                        // Initialize our server components
                        _a.sent();
                        // Create HTTP server
                        this.server = createServer(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                            var parsedUrl, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        parsedUrl = parse(req.url, true);
                                        // Let Next.js handle the request
                                        return [4 /*yield*/, handle_1(req, res, parsedUrl)];
                                    case 1:
                                        // Let Next.js handle the request
                                        _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        logger.error('Request handling error', {
                                            url: req.url,
                                            method: req.method,
                                        }, error_2 instanceof Error ? error_2 : new Error('Unknown error'));
                                        // Send error response if headers haven't been sent
                                        if (!res.headersSent) {
                                            res.statusCode = 500;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                        }
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        // Register server shutdown handler
                        serverInit.registerShutdownCallback(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.stopServer()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        // Start listening
                        return [4 /*yield*/, new Promise(function (resolve) {
                                _this.server.listen(port_1, hostname_1, function () {
                                    var duration = Date.now() - startTime;
                                    logger.info('Next.js server started', {
                                        duration: "".concat(duration, "ms"),
                                        url: "http://".concat(hostname_1, ":").concat(port_1),
                                    });
                                    resolve();
                                });
                            })];
                    case 4:
                        // Start listening
                        _a.sent();
                        // Log startup complete
                        this.logStartupComplete(hostname_1, port_1);
                        return [3 /*break*/, 7];
                    case 5:
                        error_1 = _a.sent();
                        duration = Date.now() - startTime;
                        logger.error('Server startup failed', {
                            duration: "".concat(duration, "ms"),
                        }, error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                        // Exit process on startup failure
                        process.exit(1);
                        return [3 /*break*/, 7];
                    case 6:
                        this.isStarting = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop the server gracefully
     */
    NextServerBootstrap.stopServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.server) {
                    return [2 /*return*/];
                }
                logger.info('Stopping Next.js server');
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.server.close(function (err) {
                            if (err) {
                                logger.error('Error closing server', {}, err);
                                reject(err);
                            }
                            else {
                                logger.info('Server stopped');
                                _this.server = null;
                                resolve();
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Log startup complete message
     */
    NextServerBootstrap.logStartupComplete = function (hostname, port) {
        logger.info('Server ready', {
            url: "http://".concat(hostname, ":").concat(port),
            environment: config.env.isDevelopment ? 'development' : 'production',
            features: {
                auth: true,
                salesforce: config.salesforce.enabled,
                monitoring: config.monitoring.enabled,
            },
        });
    };
    NextServerBootstrap.isStarting = false;
    NextServerBootstrap.server = null;
    return NextServerBootstrap;
}());
// Start the server
NextServerBootstrap.start().catch(function (error) {
    logger.error('Unhandled server startup error', {}, error instanceof Error ? error : new Error('Unknown error'));
    process.exit(1);
});
