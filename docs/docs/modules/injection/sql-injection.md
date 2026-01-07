# SQL Injection Protection

## Overview

SQL injection protection detects and blocks malicious SQL code in request payloads that could manipulate database queries and compromise data security.

## Why This Is Important

### The Problem: SQL Injection Attacks

Attackers inject SQL code into inputs to manipulate database queries:

#### 1. **Authentication Bypass**

```javascript
// Login form payload
{
  "username": "admin' OR '1'='1",
  "password": "anything"
}

// Without protection, query becomes:
SELECT * FROM users 
WHERE username = 'admin' OR '1'='1' 
AND password = 'anything'

// Result: '1'='1' is always true
// Attacker logs in without knowing password
```

**What Happens Without Protection:**
- Authentication completely bypassed
- Any account accessible
- No password needed

**Impact:**
- 🔓 Complete authentication bypass
- 👤 Account takeover
- 📂 Unauthorized data access
- 💰 Financial fraud

#### 2. **Data Extraction (UNION SELECT)**

```javascript
// Search query payload
{
  "search": "product' UNION SELECT username, password FROM users--"
}

// Without protection, query becomes:
SELECT name, price FROM products 
WHERE name = 'product' UNION SELECT username, password FROM users--'

// Result: Returns all usernames and passwords
```

**What Happens Without Protection:**
- Database schema revealed
- User credentials stolen
- Sensitive data exposed

**Impact:**
- 📊 Complete database dump
- 🔑 Password theft
- 💳 Payment information stolen
- 👥 User data breach

#### 3. **Data Destruction (DROP TABLE)**

```javascript
// Delete product payload
{
  "productId": "123'; DROP TABLE products--"
}

// Without protection, query becomes:
DELETE FROM products WHERE id = '123'; DROP TABLE products--'

// Result: Entire products table deleted
```

**What Happens Without Protection:**
- Critical tables dropped
- Data permanently deleted
- Application breaks completely

**Impact:**
- 💥 Data destruction
- 🗑️ Permanent data loss
- 📉 Business disruption
- 💸 Revenue loss

#### 4. **SQL Keyword Density Attack**

```javascript
// Sophisticated payload using many SQL keywords
{
  "query": "SELECT * FROM users WHERE id = 1 AND role = 'admin' OR status = 'active' JOIN permissions ON users.id = permissions.user_id"
}

// High concentration of SQL keywords indicates injection attempt
// Keywords: SELECT, FROM, WHERE, AND, OR, JOIN, ON
```

**What Happens Without Protection:**
- Complex injection succeeds
- Multiple tables queried
- Privileged data accessed

**Impact:**
- 🎯 Targeted data extraction
- 🔐 Privilege escalation
- 📋 Multi-table data theft

## How nextjs-fortress Solves This

### Detection Methods

#### 1. **Pattern Matching**

```typescript
export const SQL_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b)/gi,      // UNION SELECT
  /(\bINSERT\b.*\bINTO\b)/gi,       // INSERT INTO
  /(\bDELETE\b.*\bFROM\b)/gi,       // DELETE FROM
  /(\bDROP\b.*\bTABLE\b)/gi,        // DROP TABLE
  /(\bUPDATE\b.*\bSET\b)/gi,        // UPDATE SET
  /(\bEXEC(UTE)?\b)/gi,             // EXEC/EXECUTE
  /(\bSELECT\b.*\bFROM\b)/gi,       // SELECT FROM
  /(;\s*--)/g,                       // Comment injection
  /('|" \s*OR\s*'1'\s*=\s*'1)/gi,   // OR 1=1
  /(\bOR\b.*=.*)/gi,                 // OR conditions
  /(\bAND\b.*=.*)/gi,                // AND conditions
];
```

#### 2. **Keyword Density Analysis**

```typescript
/**
 * Check SQL keyword density (high density = likely injection)
 */
private checkSQLKeywordDensity(str: string): ValidationResult {
  const words = str.toUpperCase().split(/\s+/);
  const keywordCount = words.filter(word => 
    SQL_KEYWORDS.includes(word)
  ).length;
  
  const density = words.length > 0 ? keywordCount / words.length : 0;

  // If more than 30% of words are SQL keywords, flag it
  if (density > 0.3 && keywordCount >= 3) {
    return {
      valid: false,
      severity: 'high',
      message: `High SQL keyword density detected (${(density * 100).toFixed(0)}%)`,
      rule: 'sql_keyword_density',
      confidence: Math.min(density * 2, 1),
    };
  }

  return { valid: true };
}
```

#### 3. **Recursive Inspection**

```typescript
/**
 * Extract all strings from input (including nested objects)
 */
private extractStrings(input: unknown, depth: number = 0): string[] {
  const strings: string[] = [];
  const maxDepth = 10;

  if (depth > maxDepth) return strings;

  if (typeof input === 'string') {
    strings.push(input);
  } else if (Array.isArray(input)) {
    for (const item of input) {
      strings.push(...this.extractStrings(item, depth + 1));
    }
  } else if (input !== null && typeof input === 'object') {
    for (const value of Object.values(input)) {
      strings.push(...this.extractStrings(value, depth + 1));
    }
  }

  return strings;
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
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },
  },
};
```

### SQL Only

```typescript
export const fortressConfig: FortressConfig = {
  modules: {
    injection: {
      enabled: true,
      checks: ['sql'], // Only check SQL injection
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
      checks: ['sql'],
      customPatterns: [
        /\bTRUNCATE\b.*\bTABLE\b/gi,     // TRUNCATE TABLE
        /\bALTER\b.*\bTABLE\b/gi,        // ALTER TABLE
        /\bCREATE\b.*\bDATABASE\b/gi,    // CREATE DATABASE
      ],
    },
  },
};
```

## Attack Examples

### Example 1: Login Bypass

```javascript
// Attacker login attempt
POST /api/auth/login
{
  "username": "admin' OR '1'='1'--",
  "password": "irrelevant"
}

// Fortress detects:
// Pattern match: "OR '1'='1'" found
// Severity: critical
// Result: BLOCKED ✅
// Message: "SQL injection detected: OR '1'='1'"
```

### Example 2: Data Extraction

```javascript
// Attacker search request
POST /api/products/search
{
  "query": "laptop' UNION SELECT email, password FROM users--"
}

// Fortress detects:
// Pattern match: "UNION SELECT" found
// Severity: critical
// Result: BLOCKED ✅
```

### Example 3: Table Deletion

```javascript
// Attacker delete request
DELETE /api/product/123
{
  "id": "123'; DROP TABLE products; --"
}

// Fortress detects:
// Pattern match: "DROP TABLE" found
// Severity: critical
// Result: BLOCKED ✅
```

### Example 4: Comment Injection

```javascript
// Attacker comment injection
POST /api/comment
{
  "text": "Nice product'; DELETE FROM comments WHERE '1'='1"
}

// Fortress detects:
// Pattern match: "DELETE FROM" found
// Severity: critical
// Result: BLOCKED ✅
```

## SQL Keywords Monitored

```typescript
export const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE',
  'DELETE', 'UNION', 'JOIN', 'DROP', 'CREATE',
  'ALTER', 'TABLE', 'DATABASE', 'EXEC', 'EXECUTE',
  'AND', 'OR',
];
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
      checks: ['sql', 'command', 'xss', 'codeInjection'],
      
      // Optional: Add custom SQL patterns
      customPatterns: [
        /\bTRUNCATE\b/gi,
        /\bALTER\b/gi,
      ],
    },
  },

  onSecurityEvent: async (event) => {
    if (event.detection.rule === 'sql_injection') {
      const logger = new FortressLogger({
        enabled: true,
        level: 'warn',
        destination: 'console',
      });

      logger.warn('🚨 SQL Injection Attempt', {
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

Without SQL detection:   0.1ms per request
With SQL detection:      0.3ms per request
Overhead:               +0.2ms per request

// Attack blocked:        0.4ms (then rejected)
// Attack success:        Database compromised
```

### Why It's Fast

1. **Compiled regex** - Patterns pre-compiled
2. **Early exit** - Stops on first match
3. **Efficient extraction** - Single pass through data
4. **No database queries** - Pure computation

## Summary

**What happens without SQL injection protection:**
- Authentication bypass
- Data theft
- Database destruction
- Complete compromise

**What nextjs-fortress provides:**
- Pattern-based detection
- Keyword density analysis
- Recursive payload scanning
- Custom pattern support

**How to initialize:**
```typescript
injection: {
  enabled: true,
  checks: ['sql'],  // Enable SQL injection detection
}
```

---

**Related Documentation:**
- [Command Injection Protection](./command-injection.md)
- [XSS Protection](./xss-protection.md)
- [Code Injection Protection](./code-injection.md)