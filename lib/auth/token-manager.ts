import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { config } from '@/lib/config';
import { UserRole } from '@/lib/types/auth';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const accessSecret = new TextEncoder().encode(config.jwt.accessSecret);
const refreshSecret = new TextEncoder().encode(config.jwt.refreshSecret);

/**
 * Sign access token
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  try {
    console.log('[signAccessToken] Input payload:', payload);
    console.log('[signAccessToken] Access expiration:', config.jwt.accessExpiration);
    
    const jwt = new SignJWT({
      ...payload,
      sub: payload.userId // Set sub claim to userId for JWT standard
    })
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
export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({
    ...payload,
    sub: payload.userId // Set sub claim to userId for JWT standard
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60}s`) // Convert days to seconds
    .setIssuedAt()
    .sign(refreshSecret);
}

/**
 * Generate tokens
 */
export async function generateTokens(payload: TokenPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    console.log("[verifyAccessToken] Verifying token:", token);
    const verified = await jwtVerify(token, accessSecret);
    console.log("[verifyAccessToken] Verified result:", verified);
    
    const { sub: userId, email, role } = verified.payload;
    if (!userId || !email || !role) {
      throw new Error('Invalid token payload');
    }

    const payload: TokenPayload = {
      userId: userId as string,
      email: email as string,
      role: role as UserRole
    };
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
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const verified = await jwtVerify(token, refreshSecret);
    const { sub: userId, email, role } = verified.payload;
    if (!userId || !email || !role) {
      throw new Error('Invalid token payload');
    }

    return {
      userId: userId as string,
      email: email as string,
      role: role as UserRole
    };
  } catch (error) {
    console.error("[verifyRefreshToken] Error:", error);
    throw new Error('Invalid token');
  }
}

/**
 * Decode token
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = decodeJwt(token);
    const { sub: userId, email, role } = payload;
    if (!userId || !email || !role) {
      return null;
    }

    return {
      userId: userId as string,
      email: email as string,
      role: role as UserRole
    };
  } catch (error) {
    console.error("[decodeToken] Error:", error);
    return null;
  }
}
