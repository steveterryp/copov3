import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { config } from './config';
import { JWTPayload } from './types/auth';

const accessSecret = new TextEncoder().encode(config.jwt.accessSecret);
const refreshSecret = new TextEncoder().encode(config.jwt.refreshSecret);

/**
 * Sign access token
 */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  try {
    console.log('[signAccessToken] Input payload:', payload);
    console.log('[signAccessToken] Access expiration:', config.jwt.accessExpiration);
    
    const jwt = new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${parseInt(config.jwt.accessExpiration) * 60}s`) // Convert minutes to seconds
      .setIssuedAt();
    
    console.log('[signAccessToken] JWT before signing:', jwt);
    const token = await jwt.sign(accessSecret);
    console.log('[signAccessToken] Signed token:', token);
    
    return token;
  } catch (error) {
    console.error('[signAccessToken] Error:', error);
    throw error;
  }
}

/**
 * Sign refresh token
 */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60}s`) // Convert days to seconds
    .setIssuedAt()
    .sign(refreshSecret);
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    console.log("[verifyAccessToken] Verifying token:", token);
    const verified = await jwtVerify(token, accessSecret);
    console.log("[verifyAccessToken] Verified result:", verified);
    const payload = (verified as any).payload as JWTPayload;
    console.log("[verifyAccessToken] Parsed payload:", payload);
    return payload;
  } catch (error) {
    console.error("[verifyAccessToken] Error:", error);
    throw new Error('Invalid token');
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  try {
    const verified = await jwtVerify(token, refreshSecret);
    return (verified as any).payload as JWTPayload;
  } catch (error) {
    console.error("[verifyRefreshToken] Error:", error);
    throw new Error('Invalid token');
  }
}

/**
 * Decode token (synchronously)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const payload = decodeJwt(token);
    return payload as JWTPayload;
  } catch (error) {
    console.error("[decodeToken] Error:", error);
    return null;
  }
}

/**
 * Verify token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const verified = await jwtVerify(token, secretKey);
    return (verified as any).payload as JWTPayload;
  } catch (error) {
    console.error("[verifyToken] Error:", error);
    throw new Error('Invalid token');
  }
}
