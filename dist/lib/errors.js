var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// Base application error class
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode, code, isOperational, headers) {
        if (statusCode === void 0) { statusCode = 500; }
        if (code === void 0) { code = 'INTERNAL_SERVER_ERROR'; }
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.code = code;
        _this.isOperational = isOperational;
        _this.headers = headers;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
export { AppError };
// Authentication Errors
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    function AuthenticationError(message, headers) {
        if (message === void 0) { message = 'Authentication failed'; }
        return _super.call(this, message, 401, 'AUTHENTICATION_ERROR', true, headers) || this;
    }
    return AuthenticationError;
}(AppError));
export { AuthenticationError };
var InvalidCredentialsError = /** @class */ (function (_super) {
    __extends(InvalidCredentialsError, _super);
    function InvalidCredentialsError(message) {
        if (message === void 0) { message = 'Invalid credentials'; }
        return _super.call(this, message) || this;
    }
    return InvalidCredentialsError;
}(AuthenticationError));
export { InvalidCredentialsError };
var TokenExpiredError = /** @class */ (function (_super) {
    __extends(TokenExpiredError, _super);
    function TokenExpiredError(message) {
        if (message === void 0) { message = 'Token has expired'; }
        return _super.call(this, message) || this;
    }
    return TokenExpiredError;
}(AuthenticationError));
export { TokenExpiredError };
var TokenInvalidError = /** @class */ (function (_super) {
    __extends(TokenInvalidError, _super);
    function TokenInvalidError(message) {
        if (message === void 0) { message = 'Token is invalid'; }
        return _super.call(this, message) || this;
    }
    return TokenInvalidError;
}(AuthenticationError));
export { TokenInvalidError };
// Authorization Errors
var AuthorizationError = /** @class */ (function (_super) {
    __extends(AuthorizationError, _super);
    function AuthorizationError(message) {
        if (message === void 0) { message = 'Not authorized to perform this action'; }
        return _super.call(this, message, 403, 'AUTHORIZATION_ERROR') || this;
    }
    return AuthorizationError;
}(AppError));
export { AuthorizationError };
// Validation Errors
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, validationErrors) {
        if (message === void 0) { message = 'Validation failed'; }
        if (validationErrors === void 0) { validationErrors = {}; }
        var _this = _super.call(this, message, 400, 'VALIDATION_ERROR') || this;
        _this.validationErrors = validationErrors;
        return _this;
    }
    return ValidationError;
}(AppError));
export { ValidationError };
// Helper function to create validation error
export function createValidationError(errors) {
    var message = Object.entries(errors)
        .map(function (_a) {
        var field = _a[0], messages = _a[1];
        return "".concat(field, ": ").concat(messages.join(', '));
    })
        .join('; ');
    return new ValidationError(message, errors);
}
// Not Found Errors
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(resource) {
        if (resource === void 0) { resource = 'Resource'; }
        return _super.call(this, "".concat(resource, " not found"), 404, 'NOT_FOUND') || this;
    }
    return NotFoundError;
}(AppError));
export { NotFoundError };
// Conflict Errors
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(message) {
        if (message === void 0) { message = 'Resource already exists'; }
        return _super.call(this, message, 409, 'CONFLICT') || this;
    }
    return ConflictError;
}(AppError));
export { ConflictError };
// Database Errors
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message) {
        if (message === void 0) { message = 'Database operation failed'; }
        return _super.call(this, message, 500, 'DATABASE_ERROR', true) || this;
    }
    return DatabaseError;
}(AppError));
export { DatabaseError };
// External Service Errors
var ExternalServiceError = /** @class */ (function (_super) {
    __extends(ExternalServiceError, _super);
    function ExternalServiceError(service, message) {
        if (message === void 0) { message = 'External service error'; }
        return _super.call(this, "".concat(service, ": ").concat(message), 502, 'EXTERNAL_SERVICE_ERROR') || this;
    }
    return ExternalServiceError;
}(AppError));
export { ExternalServiceError };
// Rate Limit Errors
var RateLimitError = /** @class */ (function (_super) {
    __extends(RateLimitError, _super);
    function RateLimitError(message) {
        if (message === void 0) { message = 'Too many requests'; }
        return _super.call(this, message, 429, 'RATE_LIMIT_EXCEEDED') || this;
    }
    return RateLimitError;
}(AppError));
export { RateLimitError };
// Input/Output Errors
var IOError = /** @class */ (function (_super) {
    __extends(IOError, _super);
    function IOError(message) {
        if (message === void 0) { message = 'Input/Output operation failed'; }
        return _super.call(this, message, 500, 'IO_ERROR') || this;
    }
    return IOError;
}(AppError));
export { IOError };
// Configuration Errors
var ConfigurationError = /** @class */ (function (_super) {
    __extends(ConfigurationError, _super);
    function ConfigurationError(message) {
        if (message === void 0) { message = 'Configuration error'; }
        return _super.call(this, message, 500, 'CONFIGURATION_ERROR') || this;
    }
    return ConfigurationError;
}(AppError));
export { ConfigurationError };
// Business Logic Errors
var BusinessError = /** @class */ (function (_super) {
    __extends(BusinessError, _super);
    function BusinessError(message, code) {
        if (code === void 0) { code = 'BUSINESS_ERROR'; }
        return _super.call(this, message, 400, code) || this;
    }
    return BusinessError;
}(AppError));
export { BusinessError };
// Helper Functions
export function throwIfNotFound(resource, resourceName) {
    if (!resource) {
        throw new NotFoundError(resourceName);
    }
}
// Error Predicates
export function isAppError(error) {
    return error instanceof AppError;
}
export function isValidationError(error) {
    return error instanceof ValidationError;
}
export function isAuthenticationError(error) {
    return error instanceof AuthenticationError;
}
export function isNotFoundError(error) {
    return error instanceof NotFoundError;
}
