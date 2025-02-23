/**
 * Validates and normalizes pagination parameters
 */
export function normalizePaginationParams(params) {
    return {
        page: Math.max(1, Number(params.page) || 1),
        pageSize: Math.min(100, Math.max(1, Number(params.pageSize) || 10)),
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
    };
}
/**
 * Creates a paginated response
 */
export function createPaginatedResponse(items, total, params) {
    var totalPages = Math.ceil(total / params.pageSize);
    return {
        items: items,
        total: total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: totalPages,
    };
}
/**
 * Validates email format
 */
export function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export function isValidPassword(password) {
    var errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}
/**
 * Formats a date for display
 */
export function formatDate(date) {
    if (!date)
        return '';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
/**
 * Formats a datetime for display
 */
export function formatDateTime(date) {
    if (!date)
        return '';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
/**
 * Truncates text to a specified length
 */
export function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return "".concat(text.slice(0, maxLength), "...");
}
/**
 * Generates a random string of specified length
 */
export function generateRandomString(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Safely parses JSON with type checking
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch (_a) {
        return fallback;
    }
}
/**
 * Removes undefined values from an object
 */
export function removeUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(function (_a) {
        var _ = _a[0], value = _a[1];
        return value !== undefined;
    }));
}
/**
 * Debounces a function
 */
export function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var later = function () {
            clearTimeout(timeout);
            func.apply(void 0, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Throttles a function
 */
export function throttle(func, limit) {
    var inThrottle;
    return function executedFunction() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(void 0, args);
            inThrottle = true;
            setTimeout(function () { return (inThrottle = false); }, limit);
        }
    };
}
