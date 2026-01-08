# 🛡️ @mindfiredigital/nextjs-fortress

**Production-ready security validation middleware for Next.js applications**

Protect your Next.js apps against CVE-2025-55182, injection attacks, encoding bypasses, and other critical vulnerabilities with a zero-configuration security layer.

---

## 🚀 Quick Start

### Installation

```bash
npm i @mindfiredigital/nextjs-fortress
```

### CLI Setup

The fastest way to add fortress to your existing Next.js project:

```bash
npx fortress init
```

This automatically:
- ✅ Creates `fortress.config.ts` with production-ready defaults
- ✅ Sets up `middleware.ts` with security validation
- ✅ Generates `.env.example` with configuration options
- ✅ Creates an example protected API route

**Note**: If you already have a `middleware.ts` file, the CLI will skip creation and you'll need to integrate manually (see below).

---

## 📖 Complete Setup Guide

### 1. Create Configuration

Create `fortress.config.ts` in your project root:

```typescript
import { FortressConfig } from '@mindfiredigital/nextjs-fortress'

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'production',
  
  logging: {
    enabled: true,
    level: 'warn',
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
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET || 'your-secret-key',
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

  whitelist: {
    paths: ['/_next', '/favicon.ico', '/api/health'],
    ips: [],
  },

  onSecurityEvent: async (event) => {
    console.log('🚨 Security Event:', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      ip: event.request.ip,
    })
  },
}
```

---

## 🔧 Middleware Integration

### Option 1: New Project (No Existing Middleware)

If you don't have a `middleware.ts` file, create one:

```typescript
import { createFortressMiddleware } from '@mindfiredigital/nextjs-fortress'
import { fortressConfig } from './fortress.config'

export const middleware = createFortressMiddleware(fortressConfig)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### Option 2: Existing Middleware (Simple Integration)

If you already have middleware, wrap your existing logic with Fortress:

**Before (Your existing middleware):**
```typescript
import { NextRequest, NextResponse } from 'next/server'

// This is exactly what is happening inside the "custom logic" part
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-custom', 'value')
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
```

**After (With Fortress protection):**
```typescript
import { createFortressMiddleware } from 'nextjs-fortress'
import { fortressConfig } from './fortress.config'
import { NextRequest, NextResponse } from 'next/server'

// Option 1: Simple
// export const middleware = createFortressMiddleware(fortressConfig)

// Option 2: With custom logic - NO TYPE ERRORS
async function myMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-custom', 'value')
  return response
}

export const middleware = createFortressMiddleware(fortressConfig, myMiddleware)
```

---

## Core Security Features

### 1. **Deserialization Protection** (CVE-2025-55182)
Blocks prototype pollution and constructor injection attacks.

```typescript
// ❌ Automatically Blocked
{
  "__proto__": { "isAdmin": true },
  "constructor": { "prototype": { "hacked": true } }
}

// ✅ Allowed
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

### 2. **Injection Detection**
Protects against SQL, Command, XSS, and Code injection.

| Type | Example | Blocked |
|------|---------|---------|
| **SQL** | `admin' UNION SELECT password--` | ✅ |
| **XSS** | `<script>alert('XSS')</script>` | ✅ |
| **Command** | `; cat /etc/passwd` | ✅ |
| **Code** | `eval('malicious')` | ✅ |

### 3. **Encoding Bypass Protection**
Prevents WAF bypass using alternative encodings like UTF-16LE.

```typescript
// ❌ Blocked - UTF-16LE detected
Content-Type: application/json; charset=utf-16le

// ❌ Blocked - BOM detected (FF FE)
[0xFF, 0xFE, 0x48, 0x00]

// ✅ Allowed - Standard UTF-8
Content-Type: application/json; charset=utf-8
```

### 4. **CSRF Protection**
Token-based cross-site request forgery prevention.

### 5. **Rate Limiting**
IP and session-based request throttling.

### 6. **Content Validation**
Payload size limits and content type checking.

### 7. **Security Headers**
Automatic security header configuration.

---

### 3. Protect API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createWithFortress } from '@mindfiredigital/nextjs-fortress'
import { fortressConfig } from '@/fortress.config'

const withFortress = createWithFortress(fortressConfig)

export const POST = withFortress(
  async (request: NextRequest) => {
    const data = await request.json()
    
    // Your business logic - input is already validated!
    const user = await createUser(data)
    
    return NextResponse.json({ success: true, user })
  },
  {
    rateLimit: { requests: 10, window: 60000 },
    requireCSRF: true,
    maxPayloadSize: 512 * 1024, // 512KB
  }
)
```

### 4. Protect Server Actions

```typescript
// app/actions/user.ts
'use server'

import { createSecureServerAction } from '@mindfiredigital/nextjs-fortress'
import { fortressConfig } from '@/fortress.config'

const secureServerAction = createSecureServerAction(fortressConfig)

export const updateUserProfile = secureServerAction(
  async (userId: string, data: UserData) => {
    // Input is automatically validated and sanitized!
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
    })
    
    return { success: true, user: updatedUser }
  },
  {
    sanitizeInputs: true,
    requireCSRF: false,
  }
)
```

---

## 🎯 Attack Protection Matrix

| Attack Type | Severity | Protected |
|------------|----------|-----------|
| Prototype Pollution (CVE-2025-55182) | 🔴 Critical | ✅ |
| Constructor Injection | 🔴 Critical | ✅ |
| SQL Injection (UNION) | 🔴 Critical | ✅ |
| SQL Injection (Boolean) | 🔴 Critical | ✅ |
| SQL Injection (Time-based) | 🟠 High | ✅ |
| XSS (Script Tag) | 🟠 High | ✅ |
| XSS (Event Handler) | 🟠 High | ✅ |
| XSS (Iframe) | 🟠 High | ✅ |
| Command Injection (Shell) | 🔴 Critical | ✅ |
| Command Injection (Backticks) | 🔴 Critical | ✅ |
| Code Injection (eval) | 🔴 Critical | ✅ |
| UTF-16LE Bypass | 🔴 Critical | ✅ |
| CSRF Attacks | 🟠 High | ✅ |
| Rate Limit Abuse | 🟡 Medium | ✅ |
| Deep Nesting | 🟠 High | ✅ |

---

## ⚙️ Configuration Reference

### Module Configuration

#### Deserialization Protection

```typescript
deserialization: {
  enabled: true,
  native: false,              // Use native addon (future feature)
  maxDepth: 10,              // Maximum object nesting depth
  detectCircular: true,       // Detect circular references
  blockList?: string[],       // Custom blocked keys
  dangerousPatterns?: string[] // Custom dangerous patterns
}
```

**Protects Against:**
- `__proto__` pollution
- `constructor` injection
- `prototype` manipulation
- Deeply nested objects
- Circular references

#### Injection Detection

```typescript
injection: {
  enabled: true,
  checks: ['sql', 'command', 'xss', 'codeInjection'],
  customPatterns?: RegExp[]   // Additional custom patterns
}
```

**Detection Rules:**
- **SQL**: UNION, OR 1=1, DROP TABLE, keyword density
- **Command**: Shell metacharacters, pipes, backticks
- **XSS**: Script tags, event handlers, javascript: protocol
- **Code**: eval(), Function constructor

#### Encoding Validation

```typescript
encoding: {
  enabled: true,
  blockNonUTF8: true,         // Block non-UTF-8 encodings
  detectBOM: true,            // Detect byte order marks
  allowedEncodings?: string[] // Encoding whitelist
}
```

**Detects:**
- UTF-16LE/BE encodings
- UTF-32 encodings
- BOM signatures (0xFF 0xFE, 0xFE 0xFF)

#### CSRF Protection

```typescript
csrf: {
  enabled: true,
  tokenSecret: string,        // Required: Token generation secret
  cookieName: '_csrf',
  headerName: 'X-CSRF-Token',
  tokenLength: 32,
  expiryMs: 86400000         // 24 hours
}
```

**Features:**
- Synchronizer token pattern
- Double-submit cookie support
- Automatic token generation
- Configurable expiry

#### Rate Limiting

```typescript
rateLimit: {
  enabled: true,
  byIP: { requests: 100, window: 60000 },
  bySession: { requests: 50, window: 60000 },
  endpoints?: {              // Per-endpoint limits
    '/api/auth/login': { requests: 5, window: 300000 }
  },
  whitelist?: string[],      // Whitelisted IPs
  backoff?: {                // Exponential backoff
    enabled: true,
    multiplier: 2,
    maxDelay: 3600000
  }
}
```

**Strategies:**
- IP-based limiting
- Session-based limiting
- Per-endpoint configuration
- Exponential backoff
- IP whitelisting

#### Content Validation

```typescript
content: {
  enabled: true,
  maxPayloadSize: 1024 * 1024,  // 1MB
  allowedContentTypes?: string[], // Content-Type whitelist
  blockBinaryUploads?: boolean,
}
```

#### Security Headers

```typescript
securityHeaders: {
  enabled: true,
  headers?: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000',
    // ... custom headers
  }
}
```

---

## 🧪 Testing

### Running Tests

```bash
pnpm test                 # Run all tests
```

### Example Test

```typescript
import { createDeserializationValidator } from '@mindfiredigital/nextjs-fortress'

describe('CVE-2025-55182 Protection', () => {
  const validator = createDeserializationValidator({
    enabled: true,
    maxDepth: 10,
    detectCircular: true,
  })

  test('blocks prototype pollution', () => {
    const payload = JSON.parse('{"__proto__": {"isAdmin": true}}')
    const result = validator.validate(payload)
    
    expect(result.valid).toBe(false)
    expect(result.severity).toBe('critical')
    expect(result.rule).toBe('dangerous_key')
  })

  test('allows valid payloads', () => {
    const payload = {
      username: 'john_doe',
      email: 'john@example.com',
    }
    const result = validator.validate(payload)
    
    expect(result.valid).toBe(true)
  })
})
```

---

## 🔒 Environment Variables

Create a `.env` file in your project root:

```bash
# CSRF Protection (Required in production)
CSRF_SECRET=your-very-long-secret-key-at-least-32-characters

# Logging
FORTRESS_LOG_LEVEL=warn
FORTRESS_LOG_DESTINATION=console

# Rate Limiting
FORTRESS_RATE_LIMIT_IP=100
FORTRESS_RATE_LIMIT_WINDOW=60000

# Content Validation
FORTRESS_MAX_PAYLOAD_SIZE=1048576
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](https://github.com/mindfiredigital/nextjs-fortress/blob/main/CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT © [Mindfire Digital LLP](https://github.com/mindfiredigital)

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/mindfiredigital/nextjs-fortress/issues)
- **Documentation**: [Full Docs](https://github.com/mindfiredigital/nextjs-fortress#readme)
- **Email**: support@mindfiredigital.com

---

## 🌟 Acknowledgments

Built to protect against:
- **CVE-2025-55182** (Prototype Pollution in Next.js)
- **OWASP Top 10** vulnerabilities
- Modern web attack vectors

Special thanks to the security research community.

---

## 🎓 Learn More

- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CVE-2025-55182](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-55182)
- [Prototype Pollution](https://portswigger.net/web-security/prototype-pollution)

---

**Made with ❤️ by Mindfire Digital LLP**

*Keep your Next.js apps secure* 🛡️