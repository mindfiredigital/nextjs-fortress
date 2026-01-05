---
sidebar_position: 1
---

# Security Checkers Overview

nextjs-fortress uses a modular checker architecture where each security domain is handled by focused, independent checkers.

## Architecture
```
checkers/
├── deserialization/     # Prototype pollution protection
├── injection/           # SQL, XSS, Command, Code injection
├── encoding/            # Ghost Mode (UTF-16LE) protection
├── csrf/                # CSRF token validation
├── rateLimit/           # Request throttling
├── content/             # Payload size & type validation
└── headers/             # Security headers
```

## Available Checkers

| Checker | Purpose | Threat Level |
|---------|---------|--------------|
| **Deserialization** | Blocks `__proto__`, `constructor` pollution | 🔴 Critical |
| **Injection** | Detects SQL, XSS, Command, Code injection | 🔴 Critical |
| **Encoding** | Prevents UTF-16LE WAF bypass (Ghost Mode) | 🔴 Critical |
| **CSRF** | Validates HMAC tokens on state-changing requests | 🟠 High |
| **Rate Limit** | Throttles excessive requests | 🟡 Medium |
| **Content** | Validates payload size and content-type | 🟡 Medium |
| **Headers** | Injects security headers (CSP, HSTS, etc.) | 🟢 Low |

## Configuration

Each checker can be enabled/disabled independently:
```typescript
{
  modules: {
    deserialization: {
      enabled: true,
      prototype: { enabled: true },
      patterns: { enabled: true },
      depth: { enabled: true, maxDepth: 10 },
      circularRef: { enabled: true },
    },
    injection: {
      enabled: true,
      sql: { enabled: true },
      xss: { enabled: true },
      command: { enabled: false }, // Disable if not needed
      code: { enabled: true },
    },
  }
}
```

## Using Individual Checkers

You can use checkers independently without middleware:
```typescript
import { SQLChecker } from 'nextjs-fortress/checkers/injection'

const sqlChecker = new SQLChecker({ enabled: true })

const result = sqlChecker.check("1' OR '1'='1")
// { valid: false, severity: 'critical', attack: 'boolean', ... }
```

## Next Steps

Dive into specific checkers:

- [Deserialization Protection](./deserialization)
- [Injection Detection](./injection)
- [Encoding Validation](./encoding)
- [CSRF Protection](./csrf)
- [Rate Limiting](./rate-limit)
- [Content Validation](./content)
- [Security Headers](./headers)