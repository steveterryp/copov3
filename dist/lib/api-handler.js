var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
import { NextResponse } from 'next/server';
import { CookieManager } from './cookies';
import { logger } from './logger';
export function createApiHandler(methods) {
    var _this = this;
    return function (req, params) { return __awaiter(_this, void 0, void 0, function () {
        var startTime, method, methodHandler, duration_1, error, result, status, duration, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    method = req.method;
                    // Log incoming request
                    logger.request(req, {
                        type: 'api_request',
                        params: params,
                        timestamp: new Date().toISOString(),
                    });
                    methodHandler = methods[method];
                    if (!methodHandler) {
                        duration_1 = Date.now() - startTime;
                        error = "Method ".concat(method, " Not Allowed");
                        logger.warn('Method not allowed', {
                            method: method,
                            url: req.url,
                            duration: duration_1,
                        });
                        return [2 /*return*/, NextResponse.json({ error: error }, {
                                status: 405,
                                headers: __assign({ 'Allow': Object.keys(methods).join(', ') }, CookieManager.getSecurityHeaders()),
                            })];
                    }
                    return [4 /*yield*/, methodHandler(req, params)];
                case 1:
                    result = _a.sent();
                    status = result.status || getDefaultStatusCode(method, result);
                    duration = Date.now() - startTime;
                    response = NextResponse.json({
                        data: result.data,
                        error: result.error,
                        code: result.code,
                        errors: result.errors,
                        message: result.message,
                        validationErrors: result.validationErrors,
                    }, { status: status });
                    // Add custom headers
                    if (result.headers) {
                        Object.entries(result.headers).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            response.headers.set(key, value);
                        });
                    }
                    // Add security headers
                    Object.entries(CookieManager.getSecurityHeaders()).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        response.headers.set(key, value);
                    });
                    // Log response
                    logger.response(status, duration, {
                        url: req.url,
                        method: method,
                        type: 'api_response',
                        responseHeaders: Object.fromEntries(response.headers.entries()),
                    });
                    return [2 /*return*/, response];
            }
        });
    }); };
}
function getDefaultStatusCode(method, result) {
    if (result.error) {
        return 400; // Bad Request as default error status
    }
    switch (method) {
        case 'POST':
            return 201; // Created
        case 'DELETE':
            return 204; // No Content
        default:
            return 200; // OK
    }
}
// Helper function to parse query parameters
export function parseQueryParams(req, defaults) {
    var url = new URL(req.url);
    var params = __assign({}, defaults);
    var entries = Array.from(url.searchParams.entries());
    entries.forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (key in defaults) {
            var defaultValue = defaults[key];
            if (typeof defaultValue === 'number') {
                params[key] = Number(value);
            }
            else if (typeof defaultValue === 'boolean') {
                params[key] = value === 'true';
            }
            else {
                params[key] = value;
            }
        }
    });
    logger.debug('Parsed query parameters', {
        url: req.url,
        originalParams: Object.fromEntries(url.searchParams.entries()),
        parsedParams: params,
    });
    return params;
}
// Helper function to validate required fields
export function validateRequiredFields(data, requiredFields) {
    var missingFields = requiredFields.reduce(function (missing, field) {
        var value = data[field];
        if (value === undefined || value === null || value === '') {
            missing.push(String(field));
        }
        return missing;
    }, []);
    if (missingFields.length > 0) {
        logger.warn('Missing required fields', {
            missingFields: missingFields,
            providedData: data,
        });
    }
    return missingFields;
}
