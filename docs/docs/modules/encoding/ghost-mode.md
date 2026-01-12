# Ghost Mode Protection (Encoding Bypass)

## Overview

Ghost Mode protection detects and blocks encoding-based attacks where attackers use non-standard character encodings (like UTF-16LE) to bypass Web Application Firewalls while delivering malicious payloads to the application.

## Why This Is Important

### The Problem: WAF Bypass via Encoding

Traditional WAFs inspect payloads in UTF-8, but applications may decode other encodings:

#### 1. **The UTF-16LE Bypass**

```javascript
// What WAF sees (UTF-16LE encoded):
ÿþ_��_p��r��o��t��o��_��_

// What application decodes:
__proto__

// Result: WAF sees gibberish, app sees attack
```

**What Happens Without Protection:**
- WAF doesn't recognize malicious pattern
- Application decodes to dangerous payload
- Prototype pollution succeeds
- Attack goes undetected

**Impact:**
- Complete WAF bypass
- Prototype pollution
- CVE-2025-55182 exploitation
- Zero detection

#### 2. **BOM (Byte Order Mark) Manipulation**

```javascript
// UTF-16LE BOM: FF FE
// UTF-16BE BOM: FE FF
// UTF-32LE BOM: FF FE 00 00

// Attacker sends:
[0xFF, 0xFE, 0x5F, 0x00, 0x5F, 0x00, ...] // UTF-16LE __proto__

// WAF inspection:
"ÿþ_\u0000_\u0000p\u0000r\u0000..." // Unreadable

// Application decodes:
"__proto__" // Dangerous!
```

**What Happens Without Protection:**
- BOM indicates non-UTF-8 encoding
- WAF can't parse correctly
- Application processes malicious content
- Security bypassed completely

**Impact:**
- WAF rendered useless Stealth attacks No security logs Undetected exploitation

#### 3. **GB18030 Encoding Attack**

```javascript
// GB18030 is a Chinese character encoding
// Can represent ASCII differently
// Used to bypass pattern matching

// Attacker payload in GB18030:
[0x84, 0x31, 0x95, 0x33] // BOM
// + encoded malicious payload

// WAF: Can't read GB18030
// App: Decodes to attack payload
```

**What Happens Without Protection:**
- Exotic encodings bypass WAF
- Pattern matching fails
- Injection succeeds

**Impact:**
- International encoding abuse
- Security bypass
- Targeted attacks
- Silent exploitation

#### 4. **Mixed Encoding Attack**

```javascript
// Combine multiple encodings
// UTF-8 for safe parts
// UTF-16LE for malicious parts

POST /api/user
Content-Type: application/json; charset=utf-8

{
  "username": "normal",
  "data": "\uFFFE__proto__" // UTF-16LE BOM + attack
}
```

**What Happens Without Protection:**
- Mixed encoding confuses parsers
- Some parts validated, others not
- Partial bypass achieved

**Impact:**
- Complex bypass techniques
- Hard to detect
- Sophisticated attacks

## How nextjs-fortress Solves This

### Detection Strategy

#### 1. **Content-Type Header Validation**

```typescript
/**
 * Validate Content-Type header for dangerous encodings
 */
private validateContentTypeHeader(contentType: string): ValidationResult {
  const lowerContentType = contentType.toLowerCase();

  // Extract charset if present
  const charsetMatch = lowerContentType.match(/charset=([^;,\s]+)/);
  if (charsetMatch) {
    const charset = charsetMatch[1].toLowerCase();

    // Check against dangerous encodings
    for (const dangerous of DANGEROUS_ENCODINGS) {
      if (charset.includes(dangerous)) {
        return {
          valid: false,
          severity: 'critical',
          message: `Dangerous encoding detected: ${charset}`,
          rule: 'dangerous_encoding',
          pattern: charset,
          confidence: 1.0,
        };
      }
    }
  }

  return { valid: true };
}
```

#### 2. **BOM Detection**

```typescript
/**
 * Detect BOM (Byte Order Mark) in request body
 */
private detectBOM(body: ArrayBuffer): ValidationResult {
  const bytes = new Uint8Array(body);

  if (bytes.length < 2) return { valid: true };

  // UTF-16LE BOM: FF FE
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    if (bytes.length >= 4 && bytes[2] === 0x00 && bytes[3] === 0x00) {
      return {
        valid: false,
        severity: 'critical',
        message: 'UTF-32LE BOM detected (WAF bypass attempt)',
        rule: 'bom_utf32le',
        pattern: 'FF FE 00 00',
        confidence: 1.0,
      };
    }

    return {
      valid: false,
      severity: 'critical',
      message: 'UTF-16LE BOM detected (Ghost Mode WAF bypass)',
      rule: 'bom_utf16le',
      pattern: 'FF FE',
      confidence: 1.0,
    };
  }

  // UTF-16BE BOM: FE FF
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return {
      valid: false,
      severity: 'critical',
      message: 'UTF-16BE BOM detected (WAF bypass attempt)',
      rule: 'bom_utf16be',
      pattern: 'FE FF',
      confidence: 1.0,
    };
  }

  // GB18030 BOM: 84 31 95 33
  if (bytes.length >= 4 &&
      bytes[0] === 0x84 && bytes[1] === 0x31 &&
      bytes[2] === 0x95 && bytes[3] === 0x33) {
    return {
      valid: false,
      severity: 'high',
      message: 'GB18030 BOM detected (potential WAF bypass)',
      rule: 'bom_gb18030',
      pattern: '84 31 95 33',
      confidence: 0.95,
    };
  }

  return { valid: true };
}
```

### Dangerous Encodings List

```typescript
export const DANGEROUS_ENCODINGS = [
  'utf-16',
  'utf-16le',
  'utf-16be',
  'utf-32',
  'utf-32le',
  'utf-32be',
  'ucs-2',
  'iso-2022-jp',
  'gb18030',
] as const;
```

## Configuration

### Basic Setup

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    encoding: {
      enabled: true,
      blockNonUTF8: true,       // Block non-UTF-8 encodings
      detectBOM: true,          // Detect byte order marks
    },
  },
};
```

### Whitelist Specific Encodings

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    encoding: {
      enabled: true,
      blockNonUTF8: false,      // Allow non-UTF-8
      detectBOM: true,
      allowedEncodings: [        // But only these
        'utf-8',
        'ascii',
        'iso-8859-1',            // Latin-1 for legacy systems
      ],
    },
  },
};
```

### Maximum Security

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    encoding: {
      enabled: true,
      blockNonUTF8: true,        // Strict UTF-8 only
      detectBOM: true,           // Check all BOMs
      allowedEncodings: ['utf-8'], // Nothing else
    },
  },
};
```

## Attack Examples

### Example 1: UTF-16LE Ghost Mode

```javascript
// Attacker sends UTF-16LE encoded payload
POST /api/user
Content-Type: application/json; charset=utf-16le
Body: [0xFF, 0xFE, ...]  // UTF-16LE BOM + __proto__

// Fortress detects:
// 1. Content-Type: charset=utf-16le (DANGEROUS)
// 2. BOM: FF FE (UTF-16LE)
// Result: BLOCKED ✅
// Message: "UTF-16LE BOM detected (Ghost Mode WAF bypass)"
```

### Example 2: UTF-32 Encoding

```javascript
// Attacker uses UTF-32LE
POST /api/data
Content-Type: text/plain; charset=utf-32le
Body: [0xFF, 0xFE, 0x00, 0x00, ...]

// Fortress detects:
// BOM: FF FE 00 00 (UTF-32LE)
// Result: BLOCKED ✅
// Message: "UTF-32LE BOM detected (WAF bypass attempt)"
```

### Example 3: Header-Only Attack

```javascript
// No BOM, but dangerous charset in header
POST /api/execute
Content-Type: application/json; charset=utf-16be

// Fortress detects:
// Content-Type header: charset=utf-16be
// Result: BLOCKED ✅
// Message: "Dangerous encoding detected: utf-16be"
```

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    encoding: {
      enabled: true,
      blockNonUTF8: true,        // Block non-UTF-8
      detectBOM: true,           // Detect BOMs
      allowedEncodings: ['utf-8'], // UTF-8 only
    },
  },

  onSecurityEvent: async (event) => {
    if (event.type === 'encoding') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('👻 Ghost Mode Attack Blocked', {
        rule: event.detection.rule,
        pattern: event.detection.pattern,
        ip: event.request.ip,
      });
    }
  },
};
```

## BOM Detection Reference

| Encoding | BOM Bytes | Pattern | Risk |
|----------|-----------|---------|------|
| UTF-16LE | FF FE | Ghost Mode | Critical |
| UTF-16BE | FE FF | WAF Bypass | Critical |
| UTF-32LE | FF FE 00 00 | Complex Bypass | Critical |
| UTF-32BE | 00 00 FE FF | Complex Bypass | Critical |
| UTF-8 | EF BB BF | Allowed | Low |
| GB18030 | 84 31 95 33 | Exotic Bypass | High |

## Summary

**What happens without Ghost Mode protection:**
- WAF completely bypassed
- Prototype pollution succeeds
- Zero detection
- Silent exploitation

**What nextjs-fortress provides:**
- Content-Type validation
- BOM detection
- Non-UTF-8 blocking
- WAF bypass prevention

**How to initialize:**
```typescript
encoding: {
  enabled: true,
  blockNonUTF8: true,    // Block dangerous encodings
  detectBOM: true,       // Detect byte order marks
}
```

---

**Related Documentation:**
- [Dangerous Keys Detection](../deserialization/dangerous-keys.md)