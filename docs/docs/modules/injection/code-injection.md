 Code Injection Protection

## Overview

Code injection protection detects and blocks malicious JavaScript code patterns that could be executed via `eval()`, `Function()`, or other dynamic code execution methods.

## Why This Is Important

### The Problem: Code Injection Attacks

Attackers inject executable code that runs in the application context:

#### 1. **eval() Exploitation**

```javascript
// Calculator app that evaluates expressions
{
  "expression": "eval('require(\"child_process\").exec(\"whoami\")')"
}

// Without protection, if app uses:
const result = eval(userInput);
// Executes: eval(eval('require("child_process").exec("whoami")'))
// Result: Command execution, server compromise
```

**What Happens Without Protection:**
- Code executed in application context
- Full Node.js API access
- Server compromise

**Impact: Remote code executi Full API acce File system contr Network access

#### 2. **Function Constructor Attack**

```javascript
// Dynamic function creation
{
  "code": "Function('return process.env')().DATABASE_PASSWORD"
}

// Without protection:
const fn = new Function(userCode);
// Executes: Function that accesses process.env
// Result: Environment variables stolen
```

**What Happens Without Protection:**
- Function constructor bypasses restrictions
- Environment variables accessed
- Secrets exposed

**Impact:** Credential theft API key exposure Database passwords stolen Targeted data theft

#### 3. **setTimeout/setInterval String Injection**

```javascript
// Delayed execution
{
  "delay": "1000",
  "action": "require('fs').readFileSync('/etc/passwd')"
}

// Without protection:
setTimeout(userAction, delay);
// Executes: setTimeout("require('fs').readFileSync('/etc/passwd')", 1000)
// Result: File system access after delay
```

**What Happens Without Protection:**
- String-based setTimeout executes code
- File system accessed
- Data stolen

**Impact:**
- Delayed attacks
- File access
- Stealth exploitation
- Security bypass

#### 4. **Constructor Prototype Injection**

```javascript
// Access constructor to create functions
{
  "data": "constructor.constructor('return process')()"
}

// Without protection:
const obj = {};
obj.constructor.constructor === Function; // true
// Can execute arbitrary code
```

**What Happens Without Protection:**
- Constructor chain access
- Function creation
- Code execution

**Impact:**
- Bypass restrictions
- Arbitrary execution
- Security escape
- Full control

## How nextjs-fortress Solves This

### Detection Patterns

```typescript
export const CODE_INJECTION_PATTERNS = [
  /eval\s*\(/gi,                          // eval() calls
  /Function\s*\(/gi,                      // Function constructor
  /setTimeout\s*\(\s*["']/gi,             // String-based setTimeout
  /setInterval\s*\(\s*["']/gi,            // String-based setInterval
  /\.constructor\s*\(/gi,                 // Constructor access
  /import\s*\(/gi,                        // Dynamic imports
  /require\s*\(/gi,                       // CommonJS require
];
```

### The Algorithm

```typescript
/**
 * Check for code injection patterns
 */
private checkPatterns(
  str: string,
  patterns: RegExp[],
  type: string
): ValidationResult {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(str);

    if (match) {
      return {
        valid: false,
        severity: 'critical',
        message: `Code injection detected: "${match[0]}"`,
        rule: 'code_injection',
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
      checks: ['codeInjection'], // Enable code injection detection
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
      checks: ['codeInjection'],
      customPatterns: [
        /\bvm\b.*runInContext/gi,     // VM module
        /\bworker_threads\b/gi,        // Worker threads
        /\bcluster\b.*fork/gi,         // Cluster forking
        /\bglobal\./gi,                // Global object access
      ],
    },
  },
};
```

## Attack Examples

### Example 1: eval() Injection

```javascript
// Calculator request
POST /api/calculate
{
  "formula": "eval('process.exit(1)')"
}

// Fortress detects:
// Pattern match: "eval(" found
// Severity: critical
// Result: BLOCKED ✅
```

### Example 2: Function Constructor

```javascript
// Dynamic code execution
POST /api/execute
{
  "code": "Function('return process.env')()"
}

// Fortress detects:
// Pattern match: "Function(" found
// Result: BLOCKED ✅
```

### Example 3: setTimeout String

```javascript
// Delayed action
POST /api/schedule
{
  "action": "require('fs').writeFileSync('/tmp/backdoor', 'evil')",
  "delay": 5000
}

// Fortress detects:
// Pattern match: "require(" found
// Result: BLOCKED ✅
```

### Example 4: Constructor Chain

```javascript
// Prototype chain exploitation
POST /api/process
{
  "data": "{}.constructor.constructor('return this')()"
}

// Fortress detects:
// Pattern match: ".constructor(" found
// Result: BLOCKED ✅
```

## Dangerous Patterns Explained

| Pattern | Risk | Why Blocked |
|---------|------|-------------|
| `eval()` | Critical | Direct code execution |
| `Function()` | Critical | Creates executable functions |
| `setTimeout("code")` | High | String-based execution |
| `setInterval("code")` | High | Repeated execution |
| `.constructor()` | Critical | Bypass restrictions |
| `import()` | High | Dynamic module loading |
| `require()` | Critical | Node.js module access |

## How to Initialize

```typescript
import { FortressConfig, FortressLogger } from 'nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  modules: {
    injection: {
      enabled: true,
      checks: ['codeInjection'],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'code_injection') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('💻 Code Injection Blocked', {
        pattern: event.detection.pattern,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Summary

**What happens without code injection protection:**
- Arbitrary code execution
- Process manipulation
- Environment access
- Complete compromise

**What nextjs-fortress provides:**
- eval() detection
- Function constructor blocking
- setTimeout/setInterval protection
- Constructor chain prevention

**How to initialize:**
```typescript
injection: {
  enabled: true,
  checks: ['codeInjection'],
}
```

---

**Related Documentation:**
- [SQL Injection Protection](./sql-injection.md)
- [Command Injection Protection](./command-injection.md)
- [XSS Protection](./xss-protection.md)