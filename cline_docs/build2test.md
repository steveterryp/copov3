# Build to Test Guide: Step-by-Step Project Setup

## Phase 1: Project Initialization

### 1. Create Next.js Project
```bash
npx create-next-app@14.0.4 copov2 --typescript --tailwind --eslint
```
Configuration options:
- TypeScript: Yes
- Tailwind CSS: Yes
- ESLint: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: Yes (@/*)

### 2. Additional Dependencies
```bash
npm install @prisma/client bcryptjs jsonwebtoken cookie
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie
```

### 3. Initial Directory Structure
```bash
mkdir app/(auth)
mkdir app/(dashboard)
mkdir app/api
mkdir components
mkdir lib
mkdir middleware
mkdir prisma
mkdir cline_docs
```

## Phase 2: Project Configuration

### 1. Environment Setup
Create `.env`:
```env
NODE_ENV=development
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

### 2. TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 3. Next.js Configuration
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig
```

## Phase 3: Database Setup

### 1. Prisma Initialization
```bash
npx prisma init
```

### 2. Schema Definition
Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String?
  hashedPassword String
  role           Role          @default(USER)
  refreshTokens  RefreshToken[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

### 3. Database Migration
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Phase 4: Core Utilities Setup

### 1. API Handler (`lib/api-handler.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './errors';

export type ApiHandler = (
  req: NextRequest,
  params?: any
) => Promise<NextResponse>;

export const createApiHandler = (handler: ApiHandler): ApiHandler => {
  return async (req: NextRequest, params?: any) => {
    try {
      return await handler(req, params);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
};
```

### 2. JWT Utilities (`lib/jwt.ts`)
```typescript
import jwt from 'jsonwebtoken';
import { config } from './config';

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};
```

### 3. Cookie Management (`lib/cookies.ts`)
```typescript
import { cookies } from 'next/headers';
import { config } from './config';

export const setCookie = (name: string, value: string, options?: any) => {
  cookies().set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    ...options,
  });
};

export const getCookie = (name: string) => {
  return cookies().get(name);
};
```

## Phase 5: Authentication Implementation

### 1. Authentication Middleware (`middleware/auth.ts`)
```typescript
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { config } from '@/lib/config';

export const authMiddleware = async (req: NextRequest) => {
  const token = req.cookies.get(config.cookie.accessToken);
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const payload = verifyAccessToken(token.value);
    req.user = payload;
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
};
```

### 2. Authentication Routes
Create the following files:
- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/logout/route.ts`

### 3. Health Check Endpoint (`app/api/health/route.ts`)
```typescript
import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({ status: 'ok' });
};
```

## Phase 6: PWA Setup

### 1. Web App Manifest
Create `public/manifest.json`:
```json
{
  "name": "PoV Manager",
  "short_name": "PoV",
  "description": "Proof of Value Management Tool",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Link Manifest
Update `app/layout.tsx`:
```typescript
export const metadata = {
  manifest: '/manifest.json',
};
```

## Phase 7: Documentation Setup

### 1. Create Documentation Files
```bash
touch cline_docs/techStack.md
touch cline_docs/projectRoadmap.md
touch cline_docs/currentTask.md
touch cline_docs/codebaseSummary.md
```

### 2. Initialize Git
```bash
git init
git add .
git commit -m "Initial project setup"
```

## Next Phase: Testing Setup
The testing setup is documented separately in `testingJest.md`.
