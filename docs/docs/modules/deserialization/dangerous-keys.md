# Dangerous Keys Detection

## Overview

Dangerous keys detection is the **primary defense** against prototype pollution attacks, including CVE-2025-55182. It identifies and blocks object properties that can modify JavaScript's prototype chain.

## Why This Is Important

### The Problem: Prototype Pollution

JavaScript's prototype chain is fundamental but dangerous. Every object inherits from `Object.prototype`, and modifying it affects **every object in your application**.

#### 1. **The `__proto__` Attack**

```javascript
// Attacker sends this payload
const malicious = {
  "username": "admin",
  "__proto__": {
    "isAdmin": true
  }
};

// Without protection:
Object.prototype.isAdmin = true;

// Now EVERY object is an admin
const normalUser = {};
console.log(normalUser.isAdmin); // true 

// Authentication bypass
function checkAdmin(user) {
  if (user.isAdmin) {
    return "ACCESS GRANTED";
  }
  return "ACCESS DENIED";
}

checkAdmin({}); // "ACCESS GRANTED" 
```

**What Happens Without Protection:**
- All objects inherit malicious properties
- Authentication logic bypassed

**Impact:**
- Complete security bypass - Any user becomes admin
- Unauthorized access to all data
- Financial fraud possible
- Loss of customer trust

#### 2. **The `constructor` Attack**

```javascript
// Attacker payload
const malicious = {
  "constructor": {
    "prototype": {
      "infected": true,
      "executeCode": function() {
        require('child_process').exec('rm -rf /');
      }
    }
  }
};

// Without protection:
Object.constructor.prototype.executeCode = function() { /* evil */ };

// Now every object has malicious methods
const anyObject = {};
anyObject.executeCode(); // RCE achieved
```

**What Happens Without Protection:**
- Custom methods added to all objects
- Code execution possible
- Server compromise achieved

**Impact:**
- Remote Code Execution (RCE)
- File system access
- Steal API keys and secrets
- Install backdoors

#### 3. **The `prototype` Attack**

```javascript
// Attacker creates custom class
class User {
  constructor(data) {
    Object.assign(this, data);
  }
}

// Attacker sends
const malicious = {
  "name": "John",
  "prototype": {
    "role": "superadmin"
  }
};

const user = new User(malicious);

// Without protection:
User.prototype.role = "superadmin";

// All User instances are now superadmin
const attacker = new User({ name: "Attacker" });
console.log(attacker.role); // "superadmin" 
```

**What Happens Without Protection:**
- Class prototypes modified
- All instances affected
- Privilege escalation achieved

**Impact:**
- Privilege escalation (User → SuperAdmin)
- All future instances compromised

#### 4. **Hidden Properties Attack**

```javascript
// Sophisticated attacker uses non-enumerable properties
const malicious = {
  "username": "user123"
};

Object.defineProperty(malicious, '__proto__', {
  value: { isAdmin: true },
  enumerable: false,  // Hidden from Object.keys()
});

// Traditional check FAILS
console.log(Object.keys(malicious)); // ["username"] - looks safe!
console.log(malicious.__proto__);     // { isAdmin: true } - but isn't!
```

**What Happens Without Protection:**
- Hidden properties go undetected
- Object appears safe
- Attack succeeds silently

**Impact:**
- Stealth attacks bypass logging
- Detection evasion
- Time bomb - activates later

## How nextjs-fortress Solves This

### The Algorithm

```typescript
/**
 * Check for dangerous keys that could lead to prototype pollution
 */
private checkDangerousKeys(
  obj: unknown,
  path: string = ''
): ValidationResult {
  if (obj === null || typeof obj !== 'object') {
    return { valid: true };
  }

  const target = obj as Record<string, unknown>;

  // 1. Get ALL keys (including non-enumerable)
  const keys = Reflect.ownKeys(target);

  for (const key of keys) {
    if (typeof key !== 'string') continue;

    const lowerKey = key.toLowerCase();

    // 2. Check against blocklist
    if (this.blockList.has(lowerKey)) {
      return {
        valid: false,
        severity: 'critical',
        message: `Dangerous key detected: "${key}" at path "${path}"`,
        rule: 'dangerous_key',
        pattern: key,
        confidence: 1.0,
      };
    }

    const currentPath = path ? `${path}.${key}` : key;

    // 3. Recursively check nested objects
    try {
      const result = this.checkDangerousKeys(target[key], currentPath);
      if (!result.valid) return result;
    } catch {
      continue;
    }
  }

  // 4. THE CRITICAL CHECK: Prototype validation
  const proto = Object.getPrototypeOf(obj);
  if (proto && proto !== Object.prototype && proto !== Array.prototype) {
    return {
      valid: false,
      severity: 'critical',
      message: `Custom prototype detected at path "${path}"`,
      rule: 'custom_prototype_detected',
      confidence: 1.0,
    };
  }

  return { valid: true };
}
```

### Why This Works

**1. Comprehensive Detection** - Uses `Reflect.ownKeys()` to catch hidden properties
**2. Case-Insensitive** - Catches `__proto__`, `__Proto__`, `__PROTO__`
**3. Prototype Validation** - Detects swapped prototype chains
**4. Deep Scanning** - Recursively checks all nested levels

## Configuration

### Basic Setup

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      blockList: [
        '__proto__',
        'constructor',
        'prototype',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        'toString',
        'valueOf',
        'hasOwnProperty',
      ],
    },
  },
};
```

### Custom Blocklist

```typescript
// Add application-specific dangerous keys
export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      blockList: [
        // Default dangerous keys
        '__proto__',
        'constructor',
        'prototype',
        
        // Add custom keys for your app
        'isAdmin',
        'isModerator',
        'permissions',
        'role',
      ],
    },
  },
};
```

### Maximum Security Mode

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      blockList: [
        // Standard dangerous keys
        '__proto__',
        'constructor',
        'prototype',
        
        // Object manipulation
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        
        // Common injection targets
        'toString',
        'valueOf',
        'hasOwnProperty',
        
        // Node.js internals
        '__dirname',
        '__filename',
        'require',
        'module',
        'exports',
      ],
    },
  },
};
```

## The Blocklist Explained

| Key | Why Dangerous | Attack Vector |
|-----|---------------|---------------|
| `__proto__` | Direct prototype access | Pollutes Object.prototype |
| `constructor` | Access to constructor function | Modifies constructor.prototype |
| `prototype` | Class prototype | Affects all class instances |
| `__defineGetter__` | Define property getters | Custom property behavior |
| `__defineSetter__` | Define property setters | Custom property behavior |
| `toString` | Object string conversion | Override default behavior |
| `valueOf` | Object primitive conversion | Type coercion attacks |
| `hasOwnProperty` | Property existence check | Logic bypass |

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    deserialization: {
      enabled: true,              // Always enabled
      maxDepth: 10,
      detectCircular: true,
      
      blockList: [                // Dangerous keys to block
        '__proto__',
        'constructor',
        'prototype',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        'toString',
        'valueOf',
        'hasOwnProperty',
      ],
    },
  },

  onSecurityEvent: async (event) => {
    const logger = new FortressLogger({
      enabled: true,
      level: 'warn',
      destination: 'console',
    });

    if (event.detection.rule === 'dangerous_key') {
      logger.warn('🚨 Prototype Pollution Attempt Blocked', {
        key: event.detection.pattern,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Summary

**What happens without dangerous keys detection:**
- Prototype pollution succeeds
- Authentication bypass
- Privilege escalation
- Remote code execution
- Complete security collapse

**What nextjs-fortress provides:**
- Comprehensive key scanning
- Non-enumerable property detection
- Prototype chain validation
- Recursive inspection
- Custom blocklist support

**How to initialize:**
```typescript
deserialization: {
  enabled: true,              // Always enabled
  blockList: [                // Dangerous keys
    '__proto__',
    'constructor',
    'prototype',
    // Add custom keys here
  ],
}
```

---

**Related Documentation:**
- [Depth Limiting](./depth-limiting.md)
- [Circular References](./circular-references.md)
- [Dangerous Patterns](./dangerous-patterns.md)
- [CVE-2025-55182 Details](../../cve/cve-2025-55182.md)