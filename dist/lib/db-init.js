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
import { logger } from './logger';
import { prisma, checkDatabaseConnection } from './prisma';
import { config } from './config';
var DatabaseInitializer = /** @class */ (function () {
    function DatabaseInitializer() {
        this.isInitialized = false;
    }
    DatabaseInitializer.getInstance = function () {
        if (!DatabaseInitializer.instance) {
            DatabaseInitializer.instance = new DatabaseInitializer();
        }
        return DatabaseInitializer.instance;
    };
    /**
     * Initialize the database connection and perform necessary setup
     */
    DatabaseInitializer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, isConnected, duration, error_1, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized) {
                            logger.warn('Database already initialized');
                            return [2 /*return*/];
                        }
                        startTime = Date.now();
                        logger.info('Initializing database connection');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, checkDatabaseConnection()];
                    case 2:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('Failed to connect to database');
                        }
                        // Perform any necessary migrations or setup
                        return [4 /*yield*/, this.setupDatabase()];
                    case 3:
                        // Perform any necessary migrations or setup
                        _a.sent();
                        duration = Date.now() - startTime;
                        logger.info('Database initialization completed', {
                            duration: "".concat(duration, "ms"),
                        });
                        this.isInitialized = true;
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        duration = Date.now() - startTime;
                        logger.error('Database initialization failed', {
                            duration: "".concat(duration, "ms"),
                        }, error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform database setup and migrations
     */
    DatabaseInitializer.prototype.setupDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Add any additional setup steps here
                        return [4 /*yield*/, this.createInitialData()];
                    case 1:
                        // Add any additional setup steps here
                        _a.sent();
                        return [4 /*yield*/, this.validateDatabaseSchema()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger.error('Database setup failed', {}, error_2 instanceof Error ? error_2 : new Error('Unknown error'));
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create initial data if needed
     */
    DatabaseInitializer.prototype.createInitialData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminExists, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, prisma.user.findFirst({
                                where: { role: 'ADMIN' },
                            })];
                    case 1:
                        adminExists = _a.sent();
                        if (!(!adminExists && config.env.isDevelopment)) return [3 /*break*/, 3];
                        logger.info('Creating initial admin user');
                        return [4 /*yield*/, prisma.user.create({
                                data: {
                                    email: 'admin@example.com',
                                    name: 'Admin User',
                                    role: 'ADMIN',
                                    password: 'change_this_password', // This should be properly hashed in production
                                },
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        logger.error('Failed to create initial data', {}, error_3 instanceof Error ? error_3 : new Error('Unknown error'));
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate database schema
     */
    DatabaseInitializer.prototype.validateDatabaseSchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tables, _i, tables_1, table, error_4, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        tables = [
                            'User',
                            'RefreshToken',
                            'PoV',
                            'Task',
                            'Phase',
                        ];
                        _i = 0, tables_1 = tables;
                        _a.label = 1;
                    case 1:
                        if (!(_i < tables_1.length)) return [3 /*break*/, 6];
                        table = tables_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 FROM \"", "\" LIMIT 1"], ["SELECT 1 FROM \"", "\" LIMIT 1"])), table)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        logger.error("Table \"".concat(table, "\" not found or inaccessible"), {}, error_4 instanceof Error ? error_4 : new Error('Unknown error'));
                        throw error_4;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_5 = _a.sent();
                        logger.error('Schema validation failed', {}, error_5 instanceof Error ? error_5 : new Error('Unknown error'));
                        throw error_5;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cleanup database connections
     */
    DatabaseInitializer.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isInitialized) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma.$disconnect()];
                    case 2:
                        _a.sent();
                        this.isInitialized = false;
                        logger.info('Database connections cleaned up');
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        logger.error('Failed to cleanup database connections', {}, error_6 instanceof Error ? error_6 : new Error('Unknown error'));
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseInitializer;
}());
export { DatabaseInitializer };
// Export singleton instance
export var dbInit = DatabaseInitializer.getInstance();
var templateObject_1;
