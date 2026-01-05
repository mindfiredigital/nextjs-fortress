---
sidebar_position: 1
---

# Introduction

**nextjs-fortress** is a comprehensive security validation framework for Next.js applications that protects against major attack vectors including CVE-2025-55182, SQL injection, XSS, command injection, and more.

## 🛡️ Key Features

- ✅ **Deserialization Protection** - Guards against CVE-2025-55182 and prototype pollution
- ✅ **Injection Detection** - SQL, XSS, Command, and Code injection prevention
- ✅ **Ghost Mode Protection** - UTF-16LE encoding bypass detection
- ✅ **CSRF Protection** - HMAC-based token validation
- ✅ **Rate Limiting** - IP and session-based request throttling
- ✅ **Security Headers** - Automatic security header injection
- ✅ **Modular Architecture** - Enable/disable specific checks

## 🎯 Why nextjs-fortress?

Traditional security tools often miss modern attack vectors. nextjs-fortress provides:

1. **Zero-Config Security** - Works out of the box with sensible defaults
2. **Granular Control** - Enable only the checks you need
3. **TypeScript First** - Full type safety throughout
4. **Edge Runtime Compatible** - Works with Next.js middleware
5. **Performance Optimized** - Minimal overhead on requests

## 📦 Quick Example
```typescript
import { createFortressMiddleware } from 'nextjs-fortress'

export const middleware = createFortressMiddleware({
  enabled: true,
  mode: 'production',
  modules: {
    deserialization: { enabled: true, maxDepth: 10 },
    injection: { enabled: true, checks: ['sql', 'xss'] },
    csrf: { enabled: true, cookieName: '_csrf' },
    rateLimit: { enabled: true, byIP: { requests: 100, window: 60000 } },
  },
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## 🚀 Next Steps

- [Installation Guide](./installation) - Get started in 5 minutes
- [Quick Start Tutorial](./quick-start) - Build your first protected API
- [Security Checkers Overview](./checkers/overview) - Learn about all protection modules