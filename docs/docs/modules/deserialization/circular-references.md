# Circular Reference Detection

## Overview

Circular reference detection prevents attackers from sending self-referencing objects that can cause infinite loops, memory exhaustion, and application crashes.

## Why This Is Important

### The Problem: Self-Referencing Objects

Attackers can craft payloads where objects reference themselves, creating circular dependencies:

#### 1. **Infinite Loop Attack**

```javascript
// Attacker creates circular reference
const malicious = { name: "user" };
malicious.self = malicious; // References itself

// Without protection, this happens:
JSON.stringify(malicious);
// TypeError: Converting circular structure to JSON

// Serialization libraries try to traverse:
function serialize(obj) {
  for (const key in obj) {
    serialize(obj[key]); // Infinite recursion
  }
}
```

**What Happens Without Protection:**
- Serialization fails
- Stack overflow errors
- Application crashes
- Server becomes unresponsive

**Impact:** Server crashes and immediate downtime Infinite loops consume CPU Stack overflow errors Denial of Service (DoS)

#### 2. **Memory Exhaustion**

```javascript
// Circular reference with deep nesting
const attack = { level1: {} };
attack.level1.level2 = { level3: attack };

// Validator tries to traverse:
function validate(obj, seen = []) {
  seen.push(obj);
  for (const value of Object.values(obj)) {
    if (!seen.includes(value)) {
      validate(value, seen); // Keeps growing 'seen' array
    }
  }
}
```

**What Happens Without Protection:**
- Validation code traverses repeatedly
- Memory usage grows exponentially
- Garbage collector struggles
- Server runs out of memory

**Impact:**
- Memory exhaustion and OOM errors
- Performance degradation
- CPU spikes during GC
- Affects all users

#### 3. **JSON Serialization DoS**

```javascript
// Many APIs serialize responses
app.post('/api/user', async (req, res) => {
  const userData = await req.json(); // Contains circular ref
  
  // Later in the code:
  await db.save(JSON.stringify(userData)); // Crash
  
  // Or
  return res.json(userData); // Crash
});
```

**What Happens Without Protection:**
- JSON.stringify() throws error
- API endpoint crashes
- Error propagates
- Service becomes unavailable

**Impact:** API endpoint crashes Service unavailability Error cascades Lost revenue

#### 4. **Database Corruption**

```javascript
// Circular data sent to database
const user = {
  name: "attacker",
  profile: {}
};
user.profile.owner = user; // Circular

// Without protection:
await db.users.insert(user); // Database tries to serialize
// Error: cannot insert circular structure
// But connection may be left in bad state
```

**What Happens Without Protection:**
- Database driver fails
- Connection corruption
- Transaction rollback
- Data inconsistency

**Impact:**
- Database connection issues
- Transaction failures
- Data inconsistency
- Application instability

## How nextjs-fortress Solves This

### The Algorithm

```typescript
/**
 * Check for circular references using WeakSet
 */
private checkCircularReferences(
  obj: unknown,
  seen = new WeakSet()
): ValidationResult {
  if (obj === null || typeof obj !== 'object') {
    return { valid: true };
  }

  // Check if we've seen this object before
  if (seen.has(obj)) {
    return {
      valid: false,
      severity: 'high',
      message: 'Circular reference detected in payload',
      rule: 'circular_reference',
      confidence: 1.0,
    };
  }

  // Mark this object as seen
  seen.add(obj);

  // Recursively check all nested values
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object') {
      const result = this.checkCircularReferences(value, seen);
      if (!result.valid) {
        return result;
      }
    }
  }

  return { valid: true };
}
```

### Why This Works

**1. WeakSet Tracking** - Efficiently tracks seen objects without preventing garbage collection
**2. Early Detection** - Stops immediately when circular reference found
**3. Memory Safe** - WeakSet doesn't prevent GC of tracked objects
**4. Fast Performance** - O(n) time complexity

### WeakSet Advantages

```typescript
// Traditional approach (BAD)
const seen = []; // Array grows indefinitely
seen.includes(obj); // O(n) lookup

// Fortress approach (GOOD)
const seen = new WeakSet(); // Doesn't prevent GC
seen.has(obj); // O(1) lookup
```

## Configuration

### Basic Setup

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      detectCircular: true,  // Enable circular detection
      maxDepth: 10,
    },
  },
};
```

### With Custom Handling

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      detectCircular: true,
      maxDepth: 10,
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'circular_reference') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🔄 Circular Reference Attack Blocked', {
        ip: event.request.ip,
        path: event.request.path,
        timestamp: event.timestamp,
      });
    }
  },
};
```

## Summary

**What happens without circular reference detection:**
- Infinite loops crash server
- Memory exhaustion
- JSON serialization failures
- Database corruption

**What nextjs-fortress provides:**
- WeakSet-based detection
- Early attack prevention
- Memory-safe implementation
- Zero performance impact

**How to initialize:**
```typescript
deserialization: {
  enabled: true,
  detectCircular: true,  // Enable circular detection
  maxDepth: 10,
}
```

---

**Related Documentation:**
- [Dangerous Keys Detection](./dangerous-keys.md)
- [Depth Limiting](./depth-limiting.md)
- [Dangerous Patterns](./dangerous-patterns.md)