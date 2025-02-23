/**
 * Application configuration
 */
export const config = {
    env: {
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
    },
    app: {
        name: 'PoV Manager',
        version: '1.0.0',
        description: 'Project management tool for Proof of Value trials',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
    },
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15', // minutes
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7', // days
    },
    cookie: {
        accessToken: 'token',
        refreshToken: 'refresh_token',
        secure: false, // Set to false for local development
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
    security: {
        saltRounds: 10,
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    websocket: {
        path: '/ws',
        pingInterval: 30000,
        pingTimeout: 5000,
    },
    auth: {
        passwordMinLength: 6,
        passwordMaxLength: 100,
        passwordResetTokenExpiry: 60, // 60 minutes
        passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        passwordRequirements: [
            'At least one uppercase letter',
            'At least one lowercase letter',
            'At least one number',
            'At least one special character (@$!%*?&)',
            'Between 6 and 100 characters'
        ],
    },
};
