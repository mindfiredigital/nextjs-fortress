# Quick Start Guide

Get your Next.js application protected from CVE-2025-55182 in under 5 minutes.

## Prerequisites

- Next.js 12.0.0 or higher
- Node.js 16.0.0 or higher

## Step 1: Install (30 seconds)

```bash
npm install @mindfiredigital/nextjs-fortress
```

Or use the CLI:

```bash
npx fortress init
```

The CLI will:
- Detect your Next.js version
- Create `fortress.config.ts`
- Create `middleware.ts`
- Generate `.env.example`
- Create example API route

## Step 2: Configuration file gets created

`fortress.config.ts` in your project root gets created:

```typescript
// fortress.config.ts
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development', // Change to 'production' when deploying

  logging: {
    enabled: true,
    level: 'debug',
    destination: 'console',
  },

  modules: {
    // 1. Deserialization Protection (CVE-2025-55182)
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
    },

    // 2. Injection Detection
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },

    // 3. Encoding Validation (Ghost Mode Protection)
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },

    // 4. CSRF Protection (disable in development)
    csrf: {
      enabled: false, // Enable in production
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET,
    },

    // 5. Rate Limiting
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 100,
        window: 60000, // 100 requests per minute
      },
    },

    // 6. Content Validation
    content: {
      enabled: true,
      maxPayloadSize: 1024 * 1024, // 1MB
    },

    // 7. Security Headers
    securityHeaders: {
      enabled: true,
    },
  },

  whitelist: {
    paths: ['/_next', '/favicon.ico'],
    ips: [],
  },

  onSecurityEvent: async (event) => {
    console.warn('🚨 Security Event:', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      ip: event.request.ip,
      path: event.request.path,
    });
  },
};
```

## Step 3: Middleware gets created on the application

Create `middleware.ts` in your project root:

```typescript
// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Step 4: Test Protection (1 minute)

### Test 1: Prototype Pollution (CVE-2025-55182)

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"isAdmin": true}}'
```

**Expected Response:**
```json
{
  "error": "Dangerous key detected: \"__proto__\"",
  "rule": "dangerous_key"
}
```
**Status:** 403 Forbidden 

### Test 2: SQL Injection

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE id=1 OR 1=1"}'
```

**Expected Response:**
```json
{
  "error": "SQL injection detected: \"OR 1=1\"",
  "rule": "sql_injection"
}
```
**Status:** 403 Forbidden 

### Test 3: XSS Attack

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"comment": "<script>alert(1)</script>"}'
```

**Expected Response:**
```json
{
  "error": "XSS injection detected: \"<script>\"",
  "rule": "xss_injection"
}
```
**Status:** 403 Forbidden 

### Test 4: Rate Limiting

```bash
# Run this 101 times quickly
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/test \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
done
```

**After 100 requests:**
```
Status: 429 Too Many Requests
Retry-After: 45
```
Rate limit working!

## Environment Variables

Create `.env.local`:

```bash
# CSRF Secret (generate with: openssl rand -hex 32)
CSRF_SECRET=your-32-character-secret-key-here

# Whitelisted IPs (comma-separated)
WHITELIST_IPS=127.0.0.1,::1
```

## Verify Installation

### Create Test API Route

```typescript
// app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Request validated by Fortress',
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fortress Active',
    protections: [
      'Deserialization (CVE-2025-55182)',
      'SQL Injection',
      'XSS Attacks',
      'Command Injection',
      'Encoding Bypass (Ghost Mode)',
      'Rate Limiting',
      'Security Headers',
    ],
  });
}
```

### Test the Endpoint

```bash
# Should succeed
curl http://localhost:3000/api/test

# Should get blocked
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"hacked": true}}'
```

## What Happens Now

### Every Request Is Protected

```typescript
// Before reaching your code, fortress validates:

1. ✓ No dangerous keys (__proto__, constructor, prototype)
2. ✓ No SQL injection patterns
3. ✓ No XSS attempts
4. ✓ No command injection
5. ✓ No encoding bypasses
6. ✓ Depth limit not exceeded
7. ✓ No circular references
8. ✓ Rate limit not exceeded
9. ✓ Payload size within limit
10. ✓ Valid content type

// If all checks pass → Your handler executes
// If any check fails → 403 Forbidden + logged
```

### Security Events Are Logged

```typescript
// Console output when attack detected:
🚨 Security Event: {
  type: 'deserialization',
  severity: 'critical',
  message: 'Dangerous key detected: "__proto__"',
  ip: '192.168.1.100',
  path: '/api/test',
  rule: 'dangerous_key',
  confidence: 1.0,
  timestamp: 2025-01-07T10:30:00.000Z
}
```

## Next Steps

Now that you're protected:

1. **Monitor Security Events** - Watch console for attacks
2. **Customize Configuration** - Adjust limits for your needs
3. **Add Monitoring** - Send events to Sentry, DataDog, etc.
4. **Test Thoroughly** - Ensure it doesn't break your app
5. **Deploy to Production** - Enable CSRF and production mode

## Additional Resources

- [CVE-2025-55182 Details](./cve/cve-2025-55182.md)
- [modular-overview](./modules/deserialization/dangerous-keys.md)

## Getting Help

- 📖 [Documentation](https://fortress-docs.mindfire.com)
- 🐛 [Report Issues](https://github.com/mindfiredigital/nextjs-fortress/issues)
- 💬 [Discussions](https://github.com/mindfiredigital/nextjs-fortress/discussions)

---

**🎉 Congratulations!** Your Next.js application is now protected from CVE-2025-55182 and all major attack vectors.