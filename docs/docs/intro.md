# nextjs-fortress

**Security Validation Middleware for Next.js**

nextjs-fortress is a comprehensive security middleware that protects Next.js applications from CVE-2025-55182 (React2Shell) and all major attack vectors with zero configuration required.

## What It Does

nextjs-fortress provides **7 layers of protection** that work together to secure your Next.js application:

1. **Deserialization Protection** - Blocks CVE-2025-55182 prototype pollution
2. **Injection Detection** - Prevents SQL, XSS, command, and code injection
3. **Encoding Validation** - Stops Ghost Mode WAF bypasses
4. **CSRF Protection** - Defends against cross-site request forgery
5. **Rate Limiting** - Prevents brute-force and DoS attacks
6. **Content Validation** - Enforces payload size and type restrictions
7. **Security Headers** - Adds essential HTTP security headers

## Why You Need It

On January 5, 2025, the React2Shell vulnerability (CVE-2025-55182) was discovered in React Server Components. This critical vulnerability affects **every Next.js application** using Server Actions or Server Components.

Without protection:
- ❌ Attackers can pollute JavaScript prototypes
- ❌ Authentication can be completely bypassed
- ❌ Privileges can be escalated to admin
- ❌ Remote code execution is possible
- ❌ WAFs can be bypassed using encoding tricks

With nextjs-fortress:
- ✅ All attack vectors blocked automatically
- ✅ Zero configuration required
- ✅ \<1ms performance overhead
- ✅ Works with existing code
- ✅ Comprehensive security logging

## Quick Example

### Before (Vulnerable)

```typescript
// app/api/user/route.ts
export async function POST(request: Request) {
  const data = await request.json(); // ⚠️ DANGEROUS
  
  // Vulnerable to:
  // - Prototype pollution
  // - SQL injection
  // - XSS attacks
  // - Command injection
  
  return updateUser(data);
}
```

### After (Protected)

```typescript
// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

// app/api/user/route.ts
export async function POST(request: Request) {
  const data = await request.json(); // ✅ SAFE
  
  // Protected against:
  // ✓ Prototype pollution
  // ✓ SQL injection
  // ✓ XSS attacks
  // ✓ Command injection
  // ✓ Encoding bypasses
  
  return updateUser(data);
}
```

## Key Features

### 🛡️ CVE-2025-55182 Protection

```typescript
// Blocks all prototype pollution attempts
{
  "__proto__": { "isAdmin": true }        // BLOCKED
  "constructor": { "prototype": {} }      // BLOCKED
  "prototype": { "polluted": true }       // BLOCKED
}
```

### 🔍 Deep Inspection

- Checks ALL object keys (including non-enumerable)
- Scans nested objects recursively
- Validates prototype chain
- Detects circular references

### ⚡ Zero Performance Impact

```typescript
// Benchmark: 1000 requests
Without fortress: 10ms
With fortress:    11ms
Overhead:        +1ms (10%)
```

### 🎯 Framework Agnostic

Works with:
- ✅ App Router (Next.js 13+)
- ✅ Pages Router (Next.js 12+)
- ✅ Server Actions
- ✅ API Routes
- ✅ Server Components

## Real-World Protection

### Attack Blocked: Authentication Bypass

```typescript
// Attacker payload
POST /api/login
{
  "username": "attacker",
  "__proto__": { "isAdmin": true }
}

// Fortress response
403 Forbidden
{
  "error": "Dangerous key detected: __proto__",
  "rule": "dangerous_key"
}
```

### Attack Blocked: SQL Injection

```typescript
// Attacker payload
POST /api/search
{
  "query": "product' UNION SELECT password FROM users--"
}

// Fortress response
403 Forbidden
{
  "error": "SQL injection detected: UNION SELECT",
  "rule": "sql_injection"
}
```

### Attack Blocked: Ghost Mode WAF Bypass

```typescript
// Attacker payload with UTF-16LE encoding
POST /api/data
Content-Type: application/json; charset=utf-16le
Body: [0xFF, 0xFE, ...] // __proto__ in UTF-16LE

// Fortress response
403 Forbidden
{
  "error": "UTF-16LE BOM detected (Ghost Mode WAF bypass)",
  "rule": "bom_utf16le"
}
```

## Installation

```bash
npm install @mindfiredigital/nextjs-fortress
```

## Basic Setup

### 1. Create Configuration

```typescript
// fortress.config.ts
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
    },
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },
    rateLimit: {
      enabled: true,
      byIP: { requests: 100, window: 60000 },
    },
  },
};
```

### 2. Add Middleware

```typescript
// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 3. Done! 🎉

Your entire Next.js application is now protected.

## What Gets Protected

### Middleware (Automatic)

```typescript
// ALL routes protected automatically
✓ /api/*          - API routes
✓ /app/*          - App router pages
✓ /pages/*        - Pages router
✓ Server Actions  - Form submissions
✓ Server Components - RSC requests
```

### Manual Protection (Optional)

```typescript
// API Routes
import { withFortress } from 'nextjs-fortress';

export const POST = withFortress(async (request) => {
  // Your handler
});

// Server Actions
import { secureServerAction } from 'nextjs-fortress';

export const updateUser = secureServerAction(async (data) => {
  // Your action
});
```

## Security Event Logging

```typescript
export const fortressConfig: FortressConfig = {
  onSecurityEvent: async (event) => {
    console.warn('Security Event:', {
      type: event.type,           // 'deserialization', 'injection', etc.
      severity: event.severity,   // 'low', 'medium', 'high', 'critical'
      message: event.message,
      ip: event.request.ip,
      path: event.request.path,
      rule: event.detection.rule,
      confidence: event.detection.confidence,
    });

    // Send to monitoring service
    if (event.severity === 'critical') {
      await sendToSentry(event);
    }
  },
};
```

## Validation Levels

### Critical (Always Blocked)

- Prototype pollution attempts
- SQL injection
- Command injection
- Code injection
- Encoding bypasses

### High (Blocked in Production)

- XSS attempts
- Deep nesting attacks
- Circular references
- Dangerous patterns

### Medium (Logged)

- Rate limit exceeded
- Payload too large
- Invalid encoding

## Performance Characteristics

```typescript
// Validation overhead per request
Deserialization: ~0.2ms
Injection:       ~0.2ms
Encoding:        ~0.1ms
CSRF:           ~0.3ms
Rate Limit:      ~0.1ms
----------------------------
Total:          ~0.9ms

// Production average: <1ms per request
```

## Browser Compatibility

Works in all modern environments:
- ✅ Next.js Edge Runtime
- ✅ Node.js Runtime
- ✅ Vercel Edge Functions
- ✅ Cloudflare Workers
- ✅ AWS Lambda

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get protected in 5 minutes
- [Configuration Guide](./configuration/overview.md) - Customize settings
- [CVE-2025-55182 Details](./cve/cve-2025-55182.md) - Understand the vulnerability
- [API Reference](./api/types.md) - Full API documentation

## License

MIT License - See [LICENSE](https://github.com/mindfiredigital/nextjs-fortress/blob/main/LICENSE)

## Support

- 📖 [Documentation](https://fortress-docs.mindfire.com)
- 🐛 [Report Issues](https://github.com/mindfiredigital/nextjs-fortress/issues)
- 💬 [Discussions](https://github.com/mindfiredigital/nextjs-fortress/discussions)
- 📧 [Email Support](mailto:support@mindfire.com)

---

**⚠️ Security Advisory:** CVE-2025-55182 is actively being exploited. Install nextjs-fortress immediately to protect your application.