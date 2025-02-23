import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Environment validation
var requiredEnvVars = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
];
// Validate required environment variables
for (var _i = 0, requiredEnvVars_1 = requiredEnvVars; _i < requiredEnvVars_1.length; _i++) {
    var envVar = requiredEnvVars_1[_i];
    if (!process.env[envVar]) {
        throw new Error("Missing required environment variable: ".concat(envVar));
    }
}
export var config = {
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
    auth: {
        accessToken: {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
        },
        refreshToken: {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
        },
        passwordMinLength: 8,
        passwordMaxLength: 100,
    },
    database: {
        url: process.env.DATABASE_URL,
        maxConnections: 10,
        timeout: 30000, // 30 seconds
    },
    api: {
        prefix: '/api',
        version: 'v1',
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
        },
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        },
    },
    pagination: {
        defaultPage: 1,
        defaultPageSize: 10,
        maxPageSize: 100,
    },
    cache: {
        ttl: 60 * 60 * 1000, // 1 hour
        checkPeriod: 60 * 60 * 1000, // 1 hour
    },
    salesforce: {
        enabled: Boolean(process.env.SF_CLIENT_ID),
        clientId: process.env.SF_CLIENT_ID,
        clientSecret: process.env.SF_CLIENT_SECRET,
        username: process.env.SF_USERNAME,
        password: process.env.SF_PASSWORD,
        loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
        apiVersion: '57.0',
        syncInterval: 15 * 60 * 1000, // 15 minutes
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    monitoring: {
        enabled: true,
        healthCheckInterval: 30000, // 30 seconds
    },
    security: {
        bcryptSaltRounds: 10,
        cookieSecure: process.env.NODE_ENV === 'production',
        cookieSameSite: 'lax',
        corsEnabled: true,
        rateLimitEnabled: true,
        helmet: {
            enabled: true,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https://api.salesforce.com'],
                },
            },
        },
    },
};
// Export individual config sections for convenience
export var env = config.env, app = config.app, auth = config.auth, database = config.database, api = config.api, pagination = config.pagination, cache = config.cache, salesforce = config.salesforce, logging = config.logging, monitoring = config.monitoring, security = config.security;
