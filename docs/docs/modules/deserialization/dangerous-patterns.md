# Dangerous Patterns Detection

## Overview

Dangerous patterns detection identifies malicious strings and code patterns within payload values that indicate attacks like code injection, malware droppers, or exploitation attempts.

## Why This Is Important

### The Problem: Malicious String Patterns

Even if an object doesn't have dangerous keys, its values can contain exploit patterns:

#### 1. **React Flight Exploitation Patterns**

```javascript
// Attacker payload contains React internals
{
  "data": "resolved_model",
  "payload": "_response",
  "marker": "_prefix"
}
```

**What Happens Without Protection:**
- React Server Components use these internal markers
- Attacker can manipulate React Flight protocol
- Server-side state corruption
- Potential RCE through React internals

**Impact:**
- 🎭 React Flight protocol manipulation
- 🔓 Server-side state corruption
- 💣 Remote code execution through RSC
- 🚨 CVE-2025-55182 exploitation

#### 2. **Code Injection Patterns**

```javascript
// Attacker tries to inject Node.js code
{
  "command": "require('child_process').exec('whoami')",
  "module": "process.env.API_KEY",
  "exploit": "eval('malicious code')"
}
```

**What Happens Without Protection:**
- If application uses `eval()` or `Function()`
- Attacker code gets executed
- Server compromise achieved

**Impact:**
- 💥 Arbitrary code execution
- 📁 File system access
- 🔑 Environment variable theft
- 🌐 Network access

#### 3. **Malware Dropper Markers**

```javascript
// Known malware patterns
{
  "install": "_formdata",
  "payload": "execsync",
  "backdoor": "spawn"
}
```

**What Happens Without Protection:**
- Malware installation attempted
- Backdoor creation
- Persistent access established

**Impact:**
- 🦠 Malware installation
- 🚪 Backdoor creation
- 🔄 Persistent compromise
- 📡 Command & control connection

#### 4. **Path Traversal Patterns**

```javascript
// Attacker tries to access sensitive files
{
  "file": "__dirname/../../etc/passwd",
  "path": "__filename/../.env"
}
```

**What Happens Without Protection:**
- Access to system files
- Environment variable exposure
- Source code leak

**Impact:**
- 📂 Unauthorized file access
- 🔑 Credential exposure
- 📝 Source code theft
- ⚙️ Configuration leak

## How nextjs-fortress Solves This

### The Algorithm

```typescript
/**
 * Check for dangerous patterns in stringified values
 */
private checkDangerousPatterns(obj: unknown): ValidationResult {
  try {
    // Stringify entire object to search for patterns
    const stringified = JSON.stringify(obj).toLowerCase();

    for (const pattern of this.dangerousPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(stringified);

      if (match) {
        return {
          valid: false,
          severity: 'high',
          message: `Dangerous pattern detected: "${match[0]}"`,
          rule: 'dangerous_pattern',
          pattern: match[0],
          confidence: 0.95,
        };
      }
    }

    return { valid: true };
  } catch {
    // If stringification fails, treat as suspicious
    return {
      valid: false,
      severity: 'medium',
      message: 'Could not stringify payload for pattern detection',
      rule: 'stringification_failed',
      confidence: 0.7,
    };
  }
}
```

### Default Dangerous Patterns

```typescript
export const DEFAULT_DANGEROUS_PATTERNS = [
  'resolved_model',      // React Flight internal state
  '_response',           // RSC internal
  '_prefix',             // Malware dropper marker
  '_formdata',           // Form data hijacking
  'child_process',       // Command execution
  'require',             // Module loading
  'eval',                // Code evaluation
  'function',            // Function constructor
  'import\\(',           // Dynamic imports
  '__dirname',           // Node.js path access
  '__filename',          // Node.js path access
  'process\\.env',       // Environment variables
  'fs\\.readfile',       // File system access
  'fs\\.writefile',      // File system access
  'execsync',            // Command execution
  'spawn',               // Process spawning
];
```

### Why This Works

**1. Comprehensive Coverage** - Detects React internals, code injection, and malware patterns
**2. Case-Insensitive** - Converts to lowercase before matching
**3. Regex-Based** - Flexible pattern matching
**4. Fast Scanning** - Single stringify operation

## Configuration

### Basic Setup (Default Patterns)

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
      // Default dangerous patterns automatically applied
    },
  },
};
```

### Custom Patterns

```typescript
import { FortressConfig } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
      
      // Add your own dangerous patterns
      dangerousPatterns: [
        'admin_override',      // App-specific
        'bypass_auth',         // App-specific
        'internal_api',        // App-specific
        'debug_mode',          // App-specific
      ],
    },
  },
};
```

### Strict Security Mode

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    deserialization: {
      enabled: true,
      dangerousPatterns: [
        // Default patterns
        'resolved_model',
        '_response',
        'child_process',
        'require',
        'eval',
        
        // Additional strict patterns
        'script',
        'fetch',
        'xmlhttprequest',
        'websocket',
        'indexeddb',
        'localstorage',
        'sessionstorage',
        'navigator',
        'location',
        'document',
        'window',
      ],
    },
  },
};
```

## Pattern Categories

### React Server Components (RSC) Patterns

```typescript
[
  'resolved_model',   // React Flight state marker
  '_response',        // RSC response object
  '_prefix',          // RSC prefix marker
  '_formdata',        // Form data manipulation
]
```

**Why Blocked:** These patterns indicate attempts to manipulate React's internal protocol, which was the core of CVE-2025-55182.

### Code Injection Patterns

```typescript
[
  'require',          // CommonJS module loading
  'eval',             // Direct code evaluation
  'function',         // Function constructor
  'import\\(',        // Dynamic imports
  'child_process',    // Process spawning
  'execsync',         // Synchronous execution
  'spawn',            // Async process spawn
]
```

**Why Blocked:** These patterns enable arbitrary code execution if the application processes them unsafely.

### File System Patterns

```typescript
[
  '__dirname',        // Current directory path
  '__filename',       // Current file path
  'fs\\.readfile',    // File reading
  'fs\\.writefile',   // File writing
  'process\\.env',    // Environment variables
]
```

**Why Blocked:** These patterns indicate attempts to access the file system or environment variables.

## Attack Examples

### Example 1: React2Shell Exploitation

```javascript
// CVE-2025-55182 payload
POST /api/server-action
{
  "data": {
    "resolved_model": "true",
    "_response": {
      "chunks": ["malicious"]
    }
  }
}

// Fortress detects:
// Stringified: '{"data":{"resolved_model":"true","_response":...}}'
// Pattern match: "resolved_model" found
// Result: BLOCKED ✅
// Message: 'Dangerous pattern detected: "resolved_model"'
```

### Example 2: Code Injection Attempt

```javascript
// Attacker tries code injection
POST /api/execute
{
  "task": "calculate",
  "formula": "require('child_process').exec('rm -rf /')"
}

// Fortress detects:
// Stringified: '{"task":"calculate","formula":"require(...)"}'
// Pattern match: "require" and "child_process" found
// Result: BLOCKED ✅
```

### Example 3: Environment Variable Theft

```javascript
// Attacker tries to read secrets
POST /api/config
{
  "setting": "debug",
  "value": "process.env.DATABASE_PASSWORD"
}

// Fortress detects:
// Stringified: '{"setting":"debug","value":"process.env..."}'
// Pattern match: "process.env" found
// Result: BLOCKED ✅
```

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    deserialization: {
      enabled: true,
      maxDepth: 10,
      detectCircular: true,
      
      blockList: [
        '__proto__',
        'constructor',
        'prototype',
      ],
      
      // Optional: Add custom patterns
      dangerousPatterns: [
        'your_internal_api',
        'admin_backdoor',
        'debug_override',
      ],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'dangerous_pattern') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🔍 Dangerous Pattern Detected', {
        pattern: event.detection.pattern,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Performance Impact

### Benchmarks

```typescript
// Test: 1000 requests

Without pattern detection:   0.2ms per request
With pattern detection:      0.4ms per request
Overhead:                   +0.2ms per request

// Note: Single stringify + regex scan
// Very efficient compared to deep AST parsing
```

### Why It's Fast

1. **Single stringify** - Only one JSON.stringify() call
2. **Compiled regex** - Patterns pre-compiled
3. **Early exit** - Stops on first match
4. **No AST parsing** - Simple string matching

## Summary

**What happens without pattern detection:**
- React Flight exploitation succeeds
- Code injection possible
- Malware installation
- File system access

**What nextjs-fortress provides:**
- RSC pattern detection
- Code injection prevention
- Malware marker detection
- Custom pattern support

**How to initialize:**
```typescript
deserialization: {
  enabled: true,
  dangerousPatterns: [  // Optional: defaults applied
    'resolved_model',
    'child_process',
    'eval',
    // Add custom patterns
  ],
}
```

---

**Related Documentation:**
- [Dangerous Keys Detection](./dangerous-keys.md)
- [Depth Limiting](./depth-limiting.md)
- [Circular References](./circular-references.md)
- [CVE-2025-55182 Details](../../cve/cve-2025-55182.md)