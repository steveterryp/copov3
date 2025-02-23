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
import { config } from './config';
var CookieManager = /** @class */ (function () {
    function CookieManager() {
    }
    /**
     * Creates a cookie string with the given options
     */
    CookieManager.createCookie = function (name, value, options) {
        if (options === void 0) { options = {}; }
        var opts = __assign(__assign({}, this.defaultOptions), options);
        var parts = ["".concat(name, "=").concat(encodeURIComponent(value))];
        if (opts.httpOnly)
            parts.push('HttpOnly');
        if (opts.secure)
            parts.push('Secure');
        if (opts.sameSite)
            parts.push("SameSite=".concat(opts.sameSite));
        if (opts.maxAge !== undefined)
            parts.push("Max-Age=".concat(opts.maxAge));
        if (opts.path)
            parts.push("Path=".concat(opts.path));
        if (opts.domain)
            parts.push("Domain=".concat(opts.domain));
        return parts.join('; ');
    };
    /**
     * Creates a cookie string for the refresh token
     */
    CookieManager.createRefreshTokenCookie = function (token, maxAge) {
        if (maxAge === void 0) { maxAge = 7 * 24 * 60 * 60; }
        return this.createCookie('refreshToken', token, {
            maxAge: maxAge,
        });
    };
    /**
     * Creates a cookie string to clear the refresh token
     */
    CookieManager.clearRefreshTokenCookie = function () {
        return this.createCookie('refreshToken', '', {
            maxAge: 0,
        });
    };
    /**
     * Creates a session cookie (expires when browser closes)
     */
    CookieManager.createSessionCookie = function (name, value) {
        return this.createCookie(name, value, {
            maxAge: undefined, // Session cookie
        });
    };
    /**
     * Creates a persistent cookie with the specified max age
     */
    CookieManager.createPersistentCookie = function (name, value, maxAgeInSeconds) {
        return this.createCookie(name, value, {
            maxAge: maxAgeInSeconds,
        });
    };
    /**
     * Creates a cookie string to clear a specific cookie
     */
    CookieManager.clearCookie = function (name, options) {
        if (options === void 0) { options = {}; }
        return this.createCookie(name, '', __assign(__assign({}, options), { maxAge: 0 }));
    };
    /**
     * Parses a cookie string into an object
     */
    CookieManager.parseCookies = function (cookieString) {
        var cookies = {};
        if (!cookieString)
            return cookies;
        cookieString.split(';').forEach(function (cookie) {
            var _a, _b;
            var parts = cookie.split('=');
            var name = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a.trim();
            var value = (_b = parts[1]) === null || _b === void 0 ? void 0 : _b.trim();
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
        return cookies;
    };
    /**
     * Creates security headers for cookies
     */
    CookieManager.getSecurityHeaders = function () {
        return {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        };
    };
    /**
     * Validates a cookie name
     */
    CookieManager.isValidCookieName = function (name) {
        return /^[\w-]+$/.test(name);
    };
    /**
     * Validates a cookie value
     */
    CookieManager.isValidCookieValue = function (value) {
        // Ensure the value doesn't contain invalid characters
        return !/[;\r\n]/.test(value);
    };
    /**
     * Sanitizes a cookie value
     */
    CookieManager.sanitizeCookieValue = function (value) {
        return value.replace(/[;\r\n]/g, '');
    };
    CookieManager.defaultOptions = {
        httpOnly: true,
        secure: config.security.cookieSecure,
        sameSite: config.security.cookieSameSite,
        path: '/',
    };
    return CookieManager;
}());
export { CookieManager };
// Example usage:
/*
// Create a refresh token cookie
const refreshTokenCookie = CookieManager.createRefreshTokenCookie(token);

// Clear the refresh token cookie
const clearCookie = CookieManager.clearRefreshTokenCookie();

// Create a session cookie
const sessionCookie = CookieManager.createSessionCookie('sessionId', 'abc123');

// Create a persistent cookie
const persistentCookie = CookieManager.createPersistentCookie(
  'preferences',
  JSON.stringify({ theme: 'dark' }),
  30 * 24 * 60 * 60 // 30 days
);

// Parse cookies from a cookie string
const cookies = CookieManager.parseCookies(request.headers.get('cookie') || '');
*/
