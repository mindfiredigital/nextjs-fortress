# Depth Limiting Protection

## Overview

Depth limiting prevents attackers from sending deeply nested objects to overwhelm your server, bypass validation, or exploit parsing vulnerabilities.

## Why This Is Important

### The Problem: Deeply Nested Attack Payloads

Attackers can craft malicious payloads with excessive nesting to:

#### 1. **Stack Overflow Attacks**

```json
{
  "level1": {
    "level2": {
      "level3": {
        // ... 1000+ levels deep
        "level1000": {
          "__proto__": {
            "isAdmin": true
          }
        }
      }
    }
  }
}
```

**What Happens Without Protection:**
- JavaScript call stack overflows
- Server crashes with `RangeError: Maximum call stack size exceeded`
- Application becomes unavailable
- Denial of Service (DoS) achieved

**Impact:**
- Application crashes and downtime
- Continuous crash loops
- CPU spikes and memory leaks
- All users affected

#### 2. **Validation Bypass**

```json
{
  "user": {
    "profile": {
      "settings": {
        "preferences": {
          "security": {
            "advanced": {
              "deep": {
                "hidden": {
                  "backdoor": {
                    "__proto__": {
                      "isAdmin": true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**What Happens Without Protection:**
- Shallow validators only check top 2-3 levels
- Deep malicious payloads go undetected
- Prototype pollution succeeds
- Security breach achieved

**Impact:**
- Authentication bypass
- Privilege escalation
- Unauthorized data access

#### 3. **Parser Exploitation**

```javascript
// Deeply nested arrays
[[[[[[[[[[[[[[[["malicious"]]]]]]]]]]]]]]]
```

**What Happens Without Protection:**
- JSON parser works harder for each level
- Exponential time complexity: O(n²) or O(n³)
- Server becomes unresponsive
- CPU usage spikes to 100%

**Impact:**
- Response time degradation 
- CPU exhaustion
- Service degradation for all users

#### 4. **Memory Exhaustion**

```typescript
// Each level allocates memory
// 1000 levels × 100 bytes = 100KB per request
// 1000 concurrent requests = 100MB
```

**What Happens Without Protection:**
- Each nested level allocates memory
- Memory not released until request completes
- Multiple concurrent requests multiply impact
- Server runs out of memory

**Impact:**
- Out of Memory errors and crashes
- Garbage collection storms
- Performance degradation

## How nextjs-fortress Solves This

### The Algorithm

```typescript
/**
 * Check nesting depth to prevent deeply nested attacks
 */
private checkDepth(obj: unknown, currentDepth: number): ValidationResult {
  // Base case: exceeded max depth
  if (currentDepth > this.config.maxDepth) {
    return {
      valid: false,
      severity: 'medium',
      message: `Nesting depth exceeds maximum (${this.config.maxDepth})`,
      rule: 'max_depth_exceeded',
      confidence: 0.85,
    }
  }

  // Not an object - no need to go deeper
  if (obj === null || typeof obj !== 'object') {
    return { valid: true }
  }

  // Recursively check all nested values
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object') {
      const result = this.checkDepth(value, currentDepth + 1)
      if (!result.valid) {
        return result // Stop immediately on failure
      }
    }
  }

  return { valid: true }
}
```

### Why This Works

**1. Early Detection** - Stops immediately when limit exceeded
**2. Efficient Checking** - O(n) time, O(d) space
**3. Configurable Limits** - Adjust based on your needs

## Configuration

### Basic Setup

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,  // Blocks after 10 levels
      detectCircular: true,
    },
  },
};
```

### Choosing the Right Depth Limit

| Use Case | Recommended Depth | Reasoning |
|----------|-------------------|-----------|
| Simple APIs | 5-7 | Most API requests don't need deep nesting |
| E-commerce | 7-10 | Product data, orders, cart items |
| Social Media | 8-10 | Posts, comments, nested threads |
| Complex Forms | 10-15 | Multi-step forms, nested fields |
| Admin Dashboards | 15-20 | Complex analytics, nested reports |

### Environment-Based Configuration

```typescript
const maxDepth = process.env.NODE_ENV === 'production' ? 10 : 15;

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      maxDepth: maxDepth,
      detectCircular: true,
    },
  },
};
```

## How to Initialize

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,              // Set depth limit
      detectCircular: true,      // Enable circular detection
      blockList: [               // Dangerous keys
        '__proto__',
        'constructor',
        'prototype'
      ],
    },
  },
};
```

## Summary

**What happens without depth limiting:**
- Stack overflow crashes
- DoS attacks succeed
- Validation bypasses
- Memory exhaustion

**What nextjs-fortress provides:**
- Configurable depth limits
- Early attack detection
- Efficient validation
- Zero performance impact

**How to initialize:**
```typescript
deserialization: {
  enabled: true,
  maxDepth: 10,  // Blocks after 10 levels
  detectCircular: true,
}
```

---

**Related Documentation:**
- [Dangerous Keys Detection](./dangerous-keys.md)
- [Circular Reference Detection](./circular-references.md)
- [Dangerous Patterns Detection](./dangerous-patterns.md)