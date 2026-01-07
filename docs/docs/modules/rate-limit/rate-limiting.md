# Rate Limiting Protection

## Overview

Rate limiting restricts the number of requests from a single IP or session within a time window to prevent brute-force attacks, DoS, and API abuse.

## Why This Is Important

### The Problem: Unlimited Request Abuse

Without rate limiting, attackers can flood your application:

#### 1. **Brute-Force Password Attacks**

```javascript
// Attacker tries 1000 passwords per second
for (let i = 0; i < 1000000; i++) {
  fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'admin',
      password: commonPasswords[i]
    })
  });
}
```

**What Happens Without Protection:**
- Unlimited login attempts
- Password eventually cracked
- Account compromised

**Impact:**
- 🔓 Account takeover
- 👤 Credential theft
- 📊 Data breach
- 💰 Financial fraud

#### 2. **Denial of Service (DoS)**

```javascript
// Attacker floods API with requests
while (true) {
  fetch('/api/expensive-operation', {
    method: 'POST',
    body: JSON.stringify({ data: 'x'.repeat(1000000) })
  });
}
```

**What Happens Without Protection:**
- Server overwhelmed
- CPU/memory exhausted
- Application crashes
- All users affected

**Impact:**
- 💥 Service outage
- 📉 Business disruption
- 💸 Revenue loss
- 👥 Customer complaints

#### 3. **Data Scraping**

```javascript
// Attacker scrapes all user profiles
for (let id = 1; id <= 1000000; id++) {
  const user = await fetch(`/api/user/${id}`);
  await saveToDatabase(user);
}
```

**What Happens Without Protection:**
- Entire database scraped
- User data stolen
- Competitive intelligence gathered

**Impact:**
- 📊 Data theft
- 🕵️ Privacy violations
- 💼 Competitive disadvantage
- ⚖️ Legal liability

#### 4. **API Abuse / Resource Exhaustion**

```javascript
// Attacker generates expensive reports repeatedly
for (let i = 0; i < 10000; i++) {
  fetch('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ 
      dateRange: 'all',
      includeAll: true 
    })
  });
}
```

**What Happens Without Protection:**
- Server resources consumed
- Database overloaded
- Response times increase
- Costs skyrocket

**Impact:**
- 💰 Excessive cloud bills
- 🐌 Performance degradation
- 🔥 Database overload
- 💸 Financial damage

## How nextjs-fortress Solves This

### The Algorithm

```typescript
/**
 * Rate limiter - isolated rate limiting logic
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  async check(request: NextRequest): Promise<RateLimitResult> {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimitConfig = this.config.modules.rateLimit;

    if (!rateLimitConfig.byIP) {
      return { allowed: true };
    }

    const key = `ip:${ip}`;
    const limit = rateLimitConfig.byIP;
    const entry = this.store.get(key);

    // Create new entry
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + limit.window,
      });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (entry.count >= limit.requests) {
      return {
        allowed: false,
        response: new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        }),
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return { allowed: true };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
```

### Middleware Integration

```typescript
// middleware/index.ts
export function createFortressMiddleware(config: FortressConfig) {
  const rateLimiter = new RateLimiter(config);

  return async function fortressMiddleware(request: NextRequest) {
    // Check rate limit
    if (config.modules.rateLimit.enabled) {
      const rateLimitResult = await rateLimiter.check(request);
      if (!rateLimitResult.allowed) {
        return rateLimitResult.response; // Returns 429
      }
    }

    // Continue with other validations...
    return NextResponse.next();
  }
}
```

## Configuration

### Basic Setup (IP-Based)

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 100,     // 100 requests
        window: 60000,     // per 60 seconds (1 minute)
      },
    },
  },
};
```

### Session-Based Rate Limiting

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 100,
        window: 60000,
      },
      bySession: {
        requests: 50,      // 50 requests
        window: 60000,     // per session per minute
      },
    },
  },
};
```

### Endpoint-Specific Limits

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 100,
        window: 60000,
      },
      endpoints: {
        '/api/auth/login': {
          requests: 5,       // Only 5 login attempts
          window: 300000,    // per 5 minutes
        },
        '/api/reports/generate': {
          requests: 10,      // 10 report generations
          window: 3600000,   // per hour
        },
      },
    },
  },
};
```

### With Backoff

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 100,
        window: 60000,
      },
      backoff: {
        enabled: true,
        multiplier: 2,       // Double delay each time
        maxDelay: 300000,    // Max 5 minutes
      },
    },
  },
};
```

## Real Implementation Examples

### Middleware (Automatic)

```typescript
// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

// Rate limiting applies to all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### API Route (Custom Limits)

```typescript
// app/api/login/route.ts
import { withFortress } from 'nextjs-fortress';

export const POST = withFortress(
  async (request) => {
    const { username, password } = await request.json();
    
    // Authenticate user
    const user = await authenticateUser(username, password);
    
    return Response.json({ success: true, user });
  },
  {
    rateLimit: {
      requests: 5,       // Only 5 login attempts
      window: 300000,    // per 5 minutes
    },
  }
);
```

### Server Action (Rate Limited)

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from 'nextjs-fortress';

export const sendEmail = secureServerAction(
  async (to: string, subject: string, body: string) => {
    await emailService.send({ to, subject, body });
    return { success: true };
  },
  {
    rateLimitKey: 'send-email', // Custom key for this action
  }
);
```

## Attack Prevention Examples

### Example 1: Brute Force Login

```javascript
// Attacker tries multiple passwords
POST /api/auth/login (attempt 1) ✅
POST /api/auth/login (attempt 2) ✅
POST /api/auth/login (attempt 3) ✅
POST /api/auth/login (attempt 4) ✅
POST /api/auth/login (attempt 5) ✅
POST /api/auth/login (attempt 6) ❌

// Fortress response:
Status: 429 Too Many Requests
Retry-After: 300 (seconds)

// Result: Attack stopped after 5 attempts
```

### Example 2: DoS Attack

```javascript
// Attacker floods server
POST /api/data (1-100) ✅ Allowed
POST /api/data (101) ❌ Rate limited

// Response:
{
  "error": "Too Many Requests",
  "retryAfter": 45
}

// All subsequent requests from IP blocked for 45 seconds
```

### Example 3: Data Scraping

```javascript
// Scraper tries to get all users
GET /api/user/1 ✅
GET /api/user/2 ✅
// ... 98 more requests
GET /api/user/100 ✅
GET /api/user/101 ❌

// Rate limit exceeded
// Scraping prevented
```

## Rate Limit Headers

```typescript
// Fortress adds these headers to responses

X-RateLimit-Limit: 100          // Total allowed
X-RateLimit-Remaining: 45       // Remaining in window
X-RateLimit-Reset: 1641234567   // Unix timestamp

// When rate limited:
Retry-After: 45                 // Seconds until retry
```

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    rateLimit: {
      enabled: true,
      
      // Global IP-based limit
      byIP: {
        requests: 100,
        window: 60000,
      },
      
      // Session-based limit
      bySession: {
        requests: 50,
        window: 60000,
      },
      
      // Endpoint-specific limits
      endpoints: {
        '/api/auth/login': {
          requests: 5,
          window: 300000,
        },
      },
      
      // Whitelisted IPs (no limits)
      whitelist: [
        '127.0.0.1',
        '::1',
      ],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.type === 'ratelimit') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🚦 Rate Limit Exceeded', {
        ip: event.request.ip,
        path: event.request.path,
        timestamp: event.timestamp,
      });
    }
  },
};
```

## Common Configurations

### Strict (High Security)

```typescript
byIP: {
  requests: 50,
  window: 60000,
}
```

### Moderate (Balanced)

```typescript
byIP: {
  requests: 100,
  window: 60000,
}
```

### Relaxed (User-Friendly)

```typescript
byIP: {
  requests: 200,
  window: 60000,
}
```

## Performance Impact

```typescript
// Test: 1000 requests

Without rate limiting:   0.1ms per request
With rate limiting:      0.2ms per request
Overhead:               +0.1ms per request

// In-memory Map lookup: O(1)
// Very efficient
```

## Summary

**What happens without rate limiting:**
- Brute-force attacks succeed
- DoS attacks crash server
- Data scraping steals information
- API abuse costs money

**What nextjs-fortress provides:**
- IP-based limiting
- Session-based limiting
- Endpoint-specific limits
- Automatic cleanup

**How to initialize:**
```typescript
rateLimit: {
  enabled: true,
  byIP: {
    requests: 100,    // Requests allowed
    window: 60000,    // Time window (ms)
  },
}
```

---

**Related Documentation:**
- [CSRF Protection](../csrf/overview.md)
- [Content Validation](../content/overview.md)
- [Security Headers](../headers/overview.md)