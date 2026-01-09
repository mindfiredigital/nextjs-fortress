# CSRF Protection (Cross-Site Request Forgery)

## Overview

CSRF protection prevents attackers from tricking authenticated users into performing unwanted actions by validating that requests originate from your application.

## Why This Is Important

### The Problem: Cross-Site Request Forgery

Attackers trick authenticated users' browsers into making malicious requests:

#### 1. **State-Changing Actions**

```html
<!-- Attacker's malicious website -->
<img src="https://yourbank.com/transfer?to=attacker&amount=10000">

<!-- When logged-in user visits attacker's site: -->
<!-- Browser automatically sends cookies with request -->
<!-- Bank processes transfer without user knowledge -->
```

**What Happens Without Protection:**
- Browser sends authentication cookies
- Server sees valid session
- Action executed without consent

**Impact:**
- Unauthorized transfers
- Data deletion
- Settings changed
- Account takeover

#### 2. **Form Auto-Submission**

```html
<!-- Attacker's page -->
<form action="https://yoursite.com/api/user/delete" method="POST">
  <input type="hidden" name="confirm" value="yes">
</form>
<script>
  document.forms[0].submit();
</script>
```

**What Happens Without Protection:**
- Form auto-submits on page load
- User's cookies sent automatically
- Account deleted without consent

**Impact: Account deleti Data lo Security settings chang Privacy violations

#### 3. **JSON API Exploitation**

```javascript
// Attacker's website makes fetch request
fetch('https://yoursite.com/api/admin/promote', {
  method: 'POST',
  credentials: 'include', // Sends cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'attacker', role: 'admin' })
});
```

**What Happens Without Protection:**
- Credentials included automatically
- Admin API called
- Attacker promoted to admin

**Impact:** Privilege escalation Unauthorized access Admin rights granted Full compromise

#### 4. **Silent Background Requests**

```html
<!-- Invisible iframe on attacker's site -->
<iframe style="display:none" 
  src="https://yoursite.com/api/settings?email=attacker@evil.com">
</iframe>
```

**What Happens Without Protection:**
- Request made in background
- User doesn't notice
- Email changed to attacker's

**Impact:**
- Email hijacking
- Password reset to attacker
- Account takeover
- Complete compromise

## How nextjs-fortress Solves This

### Token Generation

```typescript
/**
 * Generate a new CSRF token for a session
 */
public async generateToken(sessionId: string): Promise<string> {
  const tokenLength = this.config.tokenLength || 32;
  const expiryMs = this.config.expiryMs || 24 * 60 * 60 * 1000;

  // Generate random token
  const randomBuffer = await generateRandomBytes(tokenLength);
  const randomToken = arrayBufferToHex(randomBuffer.buffer);

  // Create HMAC signature
  const signature = await this.createSignature(randomToken, sessionId);
  const token = `${randomToken}.${signature}`;

  // Store token with expiry
  tokenStore.set(sessionId, {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiryMs,
  });

  return token;
}
```

### Token Validation

```typescript
/**
 * Validate CSRF token from request
 */
public async validate(
  token: string | null | undefined,
  sessionId: string,
  method: string
): Promise<ValidationResult> {
  // Safe methods don't require CSRF protection
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method.toUpperCase())) {
    return { valid: true };
  }

  // No token provided
  if (!token) {
    return {
      valid: false,
      severity: 'high',
      message: 'CSRF token missing',
      rule: 'csrf_token_missing',
      confidence: 1.0,
    };
  }

  // Get stored token
  const storedToken = tokenStore.get(sessionId);
  if (!storedToken) {
    return {
      valid: false,
      severity: 'high',
      message: 'No CSRF token found for session',
      rule: 'csrf_no_session_token',
      confidence: 1.0,
    };
  }

  // Check expiry
  if (Date.now() > storedToken.expiresAt) {
    tokenStore.delete(sessionId);
    return {
      valid: false,
      severity: 'medium',
      message: 'CSRF token expired',
      rule: 'csrf_token_expired',
      confidence: 1.0,
    };
  }

  // Validate token matches
  if (token !== storedToken.token) {
    return {
      valid: false,
      severity: 'critical',
      message: 'Invalid CSRF token',
      rule: 'csrf_token_invalid',
      confidence: 1.0,
    };
  }

  // Verify signature
  const [randomPart, signature] = token.split('.');
  const expectedSignature = await this.createSignature(randomPart, sessionId);

  if (signature !== expectedSignature) {
    return {
      valid: false,
      severity: 'critical',
      message: 'CSRF token signature mismatch',
      rule: 'csrf_signature_invalid',
      confidence: 1.0,
    };
  }

  return { valid: true };
}
```

## Configuration

### Basic Setup

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET,
    },
  },
};
```

### Custom Token Settings

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      headerName: 'X-CSRF-Token',
      tokenSecret: process.env.CSRF_SECRET,
      tokenLength: 32,                    // 32 bytes = 64 hex chars
      expiryMs: 24 * 60 * 60 * 1000,     // 24 hours
    },
  },
};
```

### Environment Variables

```bash
# .env
CSRF_SECRET=your-secret-key-here-minimum-32-characters
```

## Attack Prevention Examples

### Example 1: Form Submission Attack

```javascript
// Attacker tries to submit form
POST /api/user/delete
Cookie: session=user123
// Missing CSRF token

// Fortress response:
{
  "error": "CSRF token missing",
  "rule": "csrf_token_missing"
}
// Status: 403 Forbidden
// Result: BLOCKED ✅
```

### Example 2: Invalid Token Attack

```javascript
// Attacker uses fake token
POST /api/admin/promote
Cookie: session=user123
X-CSRF-Token: fake-token-12345

// Fortress validates:
// 1. Token format check
// 2. Signature verification
// 3. Session matching
// Result: BLOCKED ✅
```

### Example 3: Expired Token

```javascript
// Token expired after 24 hours
POST /api/settings
Cookie: session=user123
X-CSRF-Token: old-token.signature

// Fortress response:
{
  "error": "CSRF token expired",
  "rule": "csrf_token_expired"
}
// Result: BLOCKED ✅
```

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      headerName: 'X-CSRF-Token',
      tokenSecret: process.env.CSRF_SECRET,
      tokenLength: 32,
      expiryMs: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  onSecurityEvent: async (event) => {
    if (event.type === 'csrf') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🛡️ CSRF Attack Blocked', {
        rule: event.detection.rule,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Token Lifecycle

1. **Generation** - Token created when user visits site
2. **Storage** - Token stored in cookie and server-side
3. **Validation** - Token checked on state-changing requests
4. **Expiry** - Token expires after configured time
5. **Cleanup** - Expired tokens removed automatically

## Summary

**What happens without CSRF protection:**
- Unauthorized actions
- Account takeover
- Data manipulation
- Silent attacks

**What nextjs-fortress provides:**
- Cryptographic tokens
- Signature verification
- Automatic validation
- Expiry management

**How to initialize:**
```typescript
csrf: {
  enabled: true,
  cookieName: '_csrf',
  tokenSecret: process.env.CSRF_SECRET,
}
```

---

**Related Documentation:**
- [Security Headers](../headers/overview.md)
- [Rate Limiting](../rate-limit/overview.md)
- [Middleware Usage](../../usage/middleware.md)