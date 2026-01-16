# What is nextjs-fortress

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

On November 29, 2025, the React2Shell vulnerability (CVE-2025-55182) was discovered in React Server Components. This critical vulnerability affects **every Next.js application** using Server Actions or Server Components.

Without protection:
- Attackers can pollute JavaScript prototypes
- Authentication can be completely bypassed
- Privileges can be escalated to admin
- Remote code execution is possible
- WAFs can be bypassed using encoding tricks

With nextjs-fortress:
- All attack vectors blocked automatically
- Zero configuration required
- Works with existing code
- Comprehensive security logging

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

### CVE-2025-55182 Protection

```typescript
// Blocks all prototype pollution attempts
{
  "__proto__": { "isAdmin": true }        // BLOCKED
  "constructor": { "prototype": {} }      // BLOCKED
  "prototype": { "polluted": true }       // BLOCKED
}
```

### Deep Inspection

- Checks ALL object keys (including non-enumerable)
- Scans nested objects recursively
- Validates prototype chain
- Detects circular references

### Framework Agnostic

Works with:
- App Router (Next.js 13+)
- Pages Router (Next.js 12+)
- Server Actions
- API Routes
- Server Components

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

## Browser Compatibility

Works in all modern environments:
- Next.js Edge Runtime
- Node.js Runtime

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get protected in 5 minutes
- [Motivation Behind Guide](./motivation.md) - Motivation Behind Building the middleware
- [CVE-2025-55182 Details](./cve/cve-2025-55182.md) - Understand the vulnerability

## License

MIT License - See [LICENSE](https://github.com/mindfiredigital/nextjs-fortress/blob/main/LICENSE)

## Support

- [Report Issues](https://github.com/mindfiredigital/nextjs-fortress/issues)

---

**Security Advisory:** CVE-2025-55182 is actively being exploited. Install nextjs-fortress immediately to protect your application.