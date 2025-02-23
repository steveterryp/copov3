var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { config } from './config';
// Custom Prisma client with logging
var createPrismaClient = function () {
    var prisma = new PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'info',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
    // Log queries in development
    if (config.env.isDevelopment) {
        prisma.$on('query', function (e) {
            logger.debug('Prisma Query', {
                query: e.query,
                params: e.params,
                duration: "".concat(e.duration, "ms"),
            });
        });
    }
    // Log all errors
    prisma.$on('error', function (e) {
        logger.error('Prisma Error', {
            target: e.target,
            message: e.message,
        }, new Error(e.message));
    });
    // Log important info
    prisma.$on('info', function (e) {
        logger.info('Prisma Info', {
            message: e.message,
            timestamp: e.timestamp,
        });
    });
    // Log warnings
    prisma.$on('warn', function (e) {
        logger.warn('Prisma Warning', {
            message: e.message,
            timestamp: e.timestamp,
        });
    });
    return prisma;
};
// Export singleton instance
export var prisma = global.prisma || createPrismaClient();
if (config.env.isDevelopment) {
    global.prisma = prisma;
}
// Utility functions for common database operations
export function withTransaction(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, result, duration, error_1, duration;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, callback(tx)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    duration = Date.now() - startTime;
                    logger.debug('Transaction completed', {
                        duration: "".concat(duration, "ms"),
                    });
                    return [2 /*return*/, result];
                case 3:
                    error_1 = _a.sent();
                    duration = Date.now() - startTime;
                    logger.error('Transaction failed', {
                        duration: "".concat(duration, "ms"),
                    }, error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Health check function
export function checkDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, duration, error_2, duration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                case 2:
                    _a.sent();
                    duration = Date.now() - startTime;
                    logger.info('Database connection check successful', {
                        duration: "".concat(duration, "ms"),
                    });
                    return [2 /*return*/, true];
                case 3:
                    error_2 = _a.sent();
                    duration = Date.now() - startTime;
                    logger.error('Database connection check failed', {
                        duration: "".concat(duration, "ms"),
                    }, error_2 instanceof Error ? error_2 : new Error('Unknown error'));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Batch operation utility
export function batchOperation(items, batchSize, operation) {
    return __awaiter(this, void 0, void 0, function () {
        var results, startTime, processedCount, i, batch, batchResults, duration, error_3, duration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    startTime = Date.now();
                    processedCount = 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < items.length)) return [3 /*break*/, 5];
                    batch = items.slice(i, i + batchSize);
                    return [4 /*yield*/, operation(batch)];
                case 3:
                    batchResults = _a.sent();
                    results.push.apply(results, batchResults);
                    processedCount += batch.length;
                    logger.debug('Batch processed', {
                        processedCount: processedCount,
                        totalCount: items.length,
                        batchSize: batchSize,
                        currentBatchSize: batch.length,
                    });
                    _a.label = 4;
                case 4:
                    i += batchSize;
                    return [3 /*break*/, 2];
                case 5:
                    duration = Date.now() - startTime;
                    logger.info('Batch operation completed', {
                        totalProcessed: processedCount,
                        duration: "".concat(duration, "ms"),
                    });
                    return [2 /*return*/, results];
                case 6:
                    error_3 = _a.sent();
                    duration = Date.now() - startTime;
                    logger.error('Batch operation failed', {
                        processedCount: processedCount,
                        totalCount: items.length,
                        duration: "".concat(duration, "ms"),
                    }, error_3 instanceof Error ? error_3 : new Error('Unknown error'));
                    throw error_3;
                case 7: return [2 /*return*/];
            }
        });
    });
}
export default prisma;
var templateObject_1;
