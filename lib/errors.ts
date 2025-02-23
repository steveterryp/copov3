/**
 * Base error class
 */
export class AppError extends Error {
  code: string;
  details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string, code = 'UNAUTHORIZED', details?: Record<string, any>) {
    super(message, code, details);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR', details?: Record<string, any>) {
    super(message, code, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string, code = 'DATABASE_ERROR', details?: Record<string, any>) {
    super(message, code, details);
  }
}

/**
 * API error
 */
export class ApiError extends AppError {
  statusCode: number;

  constructor(code: ErrorCodeType, message: string, details?: Record<string, any>) {
    super(message, code, details);
    this.statusCode = getStatusCodeForError(code);
  }
}

/**
 * Type guards
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Error codes
 */
export const ErrorCode = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  BAD_REQUEST: 'BAD_REQUEST',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NOT_FOUND: 'NOT_FOUND',

  // API errors
  API_ERROR: 'API_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_TOKEN:
    case ErrorCode.TOKEN_EXPIRED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_REQUEST:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_FIELD_VALUE:
    case ErrorCode.BAD_REQUEST:
      return 400;
    case ErrorCode.RECORD_NOT_FOUND:
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.API_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.DUPLICATE_RECORD:
    case ErrorCode.FOREIGN_KEY_VIOLATION:
    default:
      return 500;
  }
}
