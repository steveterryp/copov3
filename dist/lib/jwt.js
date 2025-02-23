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
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
// Access token functions
export var generateAccessToken = function (payload) {
    var secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
        throw new Error('JWT_ACCESS_SECRET is not defined');
    return jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });
};
export var verifyAccessToken = function (token) {
    var secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
        throw new Error('JWT_ACCESS_SECRET is not defined');
    try {
        var decoded = jwt.verify(token, secret);
        // Ensure the role is a valid Role enum value
        if (!Object.values(Role).includes(decoded.role)) {
            throw new Error('Invalid role in token');
        }
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
    }
    catch (error) {
        throw new Error('Invalid access token');
    }
};
// Refresh token functions
export var generateRefreshToken = function (payload) {
    var secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET is not defined');
    return jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
};
export var verifyRefreshToken = function (token) {
    var secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET is not defined');
    try {
        var decoded = jwt.verify(token, secret);
        return {
            userId: decoded.userId,
            tokenId: decoded.tokenId,
        };
    }
    catch (error) {
        throw new Error('Invalid refresh token');
    }
};
// Helper functions
export var extractTokenFromHeader = function (header) {
    var _a = header.split(' '), type = _a[0], token = _a[1];
    if (type !== 'Bearer') {
        throw new Error('Invalid token type');
    }
    return token;
};
export var generateTokens = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshTokenId, accessToken, refreshToken;
    return __generator(this, function (_a) {
        refreshTokenId = Math.random().toString(36).substr(2, 9);
        accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        refreshToken = generateRefreshToken({
            userId: user.id,
            tokenId: refreshTokenId,
        });
        return [2 /*return*/, {
                accessToken: accessToken,
                refreshToken: refreshToken,
                refreshTokenId: refreshTokenId,
            }];
    });
}); };
