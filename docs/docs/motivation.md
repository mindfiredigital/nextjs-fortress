---
sidebar_position: 2
---

# Installation

## Prerequisites

- Node.js 16.0.0 or higher
- Next.js 12.0.0 or higher

## Install Package
```bash
# npm
npm install nextjs-fortress

# pnpm
pnpm add nextjs-fortress

# yarn
yarn add nextjs-fortress
```

## CLI Setup (Recommended)

The easiest way to set up nextjs-fortress is using our CLI:
```bash
npx fortress init
```

This will:
1. ✅ Create `fortress.config.ts` with default configuration
2. ✅ Create `middleware.ts` with security middleware
3. ✅ Generate `.env.example` with required secrets
4. ✅ Create example protected API route

## Manual Setup

If you prefer manual setup:

### 1. Create Configuration

Create `fortress.config.ts` in your project root:
```typescript
import { FortressConfig } from 'nextjs-fortress'

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',
  
  logging: {
    enabled: true,
    level: 'debug',
    destination: 'console',
  },

  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
    },
    injection: {
      enabled: true,
      checks: ['sql', 'xss', 'command', 'codeInjection'],
    },
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET,
    },
    rateLimit: {
      enabled: true,
      byIP: { requests: 100, window: 60000 },
    },
    content: {
      enabled: true,
      maxPayloadSize: 1024 * 1024, // 1MB
    },
    securityHeaders: {
      enabled: true,
    },
  },
}
```

### 2. Create Middleware

Create `middleware.ts` in your project root:
```typescript
import { createFortressMiddleware } from 'nextjs-fortress'
import { fortressConfig } from './fortress.config'

export const middleware = createFortressMiddleware(fortressConfig)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Environment Variables

Add to `.env`:
```bash
# Generate with: openssl rand -hex 32
CSRF_SECRET=your-secret-key-here
```

## Verify Installation

Create a test API route:
```typescript
// app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  return NextResponse.json({
    success: true,
    message: '✅ Request validated by Fortress',
    data: body,
  })
}
```

Test protection:
```bash
# This should be blocked
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"isAdmin": true}}'
```

## Next Steps

- [Quick Start Tutorial](./quick-start) - Build your first protected API
- [Configuration Guide](./api/configuration) - Customize security settings