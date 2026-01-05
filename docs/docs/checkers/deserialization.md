---
sidebar_position: 2
---

# Deserialization Protection

Protects against CVE-2025-55182 and prototype pollution attacks.

## Overview

The deserialization checker prevents attacks that manipulate JavaScript's prototype chain to inject malicious properties into all objects.

## How It Works
```typescript
// ❌ Blocked: Prototype pollution
{
  "__proto__": { "isAdmin": true }
}

// ❌ Blocked: Constructor manipulation
{
  "constructor": { "prototype": { "polluted": true } }
}

// ✅ Allowed: Normal object
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

## Configuration
```typescript
{
  modules: {
    deserialization: {
      enabled: true,
      prototype: {
        enabled: true,
        checkCustomPrototypes: true,
        blockList: ['__proto__', 'constructor', 'prototype'],
      },
      patterns: {
        enabled: true,
        patterns: ['resolved_model', '_response', '_prefix'],
      },
      depth: {
        enabled: true,
        maxDepth: 10,
      },
      circularRef: {
        enabled: true,
      },
    },
  }
}
```

## Sub-Checkers

### 1. Prototype Checker

Blocks dangerous property names:
```typescript
const blockedKeys = [
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
]
```

### 2. Pattern Checker

Detects CVE-2025-55182 patterns:
```typescript
const dangerousPatterns = [
  'resolved_model',    // React Flight internal
  '_response',         // RSC internal
  '_prefix',           // Malware dropper
  'child_process',     // Command execution
  'require',           // Module loading
]
```

### 3. Depth Checker

Prevents deeply nested attacks:
```typescript
// ❌ Blocked: Exceeds maxDepth (10)
{
  "l1": { "l2": { "l3": { ... "l11": { "tooDeep": true }}}}
}
```

### 4. Circular Reference Checker

Detects circular references:
```typescript
const obj = {}
obj.self = obj  // ❌ Blocked: Circular reference
```

## Usage Example
```typescript
import { PrototypeChecker, PatternChecker, DepthChecker } from 'nextjs-fortress'

const prototypeChecker = new PrototypeChecker({
  enabled: true,
  checkCustomPrototypes: true,
})

const result = prototypeChecker.check({
  username: 'admin',
  __proto__: { isAdmin: true },
})

console.log(result)
// {
//   valid: false,
//   severity: 'critical',
//   message: 'Dangerous key detected: "__proto__"',
//   rule: 'dangerous_key',
//   confidence: 1.0
// }
```

## Testing
```typescript
import { createDeserializationValidator } from 'nextjs-fortress'

describe('Deserialization Protection', () => {
  const validator = createDeserializationValidator({
    enabled: true,
    maxDepth: 10,
    detectCircular: true,
  })

  it('should block __proto__ pollution', () => {
    const payload = { "__proto__": { "isAdmin": true } }
    const result = validator.validate(payload)
    expect(result.valid).toBe(false)
  })
})
```

## Performance

- ✅ **Fast Path**: Checks common patterns first
- ✅ **WeakSet**: Uses WeakSet for circular detection (no memory leaks)
- ✅ **Early Exit**: Stops on first violation

Benchmark: ~0.1ms per validation for typical payloads.