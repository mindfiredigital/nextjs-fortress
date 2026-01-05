---
sidebar_position: 3
---

# Quick Start

Learn how to protect your Next.js application in 5 minutes.

## Step 1: Basic Protection

After installation, your middleware is automatically protecting all routes:
```typescript
// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress'

export const middleware = createFortressMiddleware({
  enabled: true,
  mode: 'development',
  modules: {
    deserialization: { enabled: true, maxDepth: 10 },
    injection: { enabled: true, checks: ['sql', 'xss'] },
  },
})
```

## Step 2: Protect API Routes

### Option A: Automatic (via Middleware)

All API routes under `/api/*` are automatically protected.

### Option B: Manual (for specific routes)
```typescript
// app/api/users/route.ts
import { createWithFortress } from 'nextjs-fortress'
import { fortressConfig } from '@/fortress.config'

const withFortress = createWithFortress(fortressConfig)

export const POST = withFortress(
  async (request) => {
    const data = await request.json()
    // Your business logic here
    return Response.json({ success: true, data })
  },
  {
    requireCSRF: true,
    rateLimit: { requests: 10, window: 60000 },
    maxPayloadSize: 100000,
  }
)
```

## Step 3: Protect Server Actions
```typescript
// app/actions.ts
'use server'

import { createSecureServerAction } from 'nextjs-fortress'
import { fortressConfig } from '@/fortress.config'

const secureAction = createSecureServerAction(fortressConfig)

export const updateProfile = secureAction(
  async (userId: string, data: { name: string; email: string }) => {
    // Inputs are automatically validated
    // Safe to use data here
    await db.user.update({ where: { id: userId }, data })
    return { success: true }
  },
  {
    sanitizeInputs: true,
    requireCSRF: false,
  }
)
```

## Step 4: Enable/Disable Specific Checks
```typescript
// fortress.config.ts
export const fortressConfig: FortressConfig = {
  modules: {
    injection: {
      enabled: true,
      sql: { enabled: true },      // ✅ Enable SQL injection detection
      xss: { enabled: true },       // ✅ Enable XSS detection
      command: { enabled: false },  // ❌ Disable if no shell access
      code: { enabled: true },      // ✅ Enable code injection detection
    },
  },
}
```

## Step 5: Handle Security Events
```typescript
// fortress.config.ts
export const fortressConfig: FortressConfig = {
  onSecurityEvent: async (event) => {
    console.log(`🚨 Security Event: ${event.type}`, {
      severity: event.severity,
      message: event.message,
      ip: event.request.ip,
      path: event.request.path,
    })

    // Send to external monitoring
    if (event.severity === 'critical') {
      await sendToSentry(event)
      await notifySlack(event)
    }
  },
}
```

## Testing Your Setup

### Test 1: Prototype Pollution (Should be blocked)
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"isAdmin": true}}'

# Expected: 403 Forbidden
```

### Test 2: SQL Injection (Should be blocked)
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"username": "admin'\'' OR '\''1'\''='\''1"}'

# Expected: 403 Forbidden
```

### Test 3: Normal Request (Should succeed)
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "email": "john@example.com"}'

# Expected: 200 OK
```

## Next Steps

- [Security Checkers Overview](./checkers/overview) - Learn about all protection modules
- [Enable/Disable Specific Checks](./guides/enabling-checks) - Customize your security
- [Custom Checkers](./guides/custom-checkers) - Extend with your own validators