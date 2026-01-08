// tests/validators/injection.test.ts

import { describe, test, expect, beforeEach } from '@jest/globals'
import { createInjectionValidator } from '../../src'

describe('InjectionValidator', () => {
  let validator: any

  beforeEach(() => {
    validator = createInjectionValidator({
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    })
  })

  describe('SQL Injection Detection', () => {
    test('should detect UNION SELECT attack', () => {
      const payload = {
        username: "admin' UNION SELECT password FROM users--",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
      expect(result.rule).toBe('sql_injection')
    })

    test('should detect OR 1=1 attack', () => {
      const payload = {
        password: "' OR '1'='1",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect DROP TABLE attack', () => {
      const payload = {
        query: "'; DROP TABLE users--",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect high SQL keyword density', () => {
      const payload = {
        query: "SELECT * FROM users WHERE id=1 AND name='admin' OR 1=1",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.rule).toContain('sql')
    })
  })

  describe('Command Injection Detection', () => {
    test('should detect shell metacharacters', () => {
      const payload = {
        filename: '; cat /etc/passwd',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })

    test('should detect pipe commands', () => {
      const payload = {
        path: '| whoami',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect backtick substitution', () => {
      const payload = {
        command: '`cat /etc/shadow`',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect command substitution', () => {
      const payload = {
        input: '$(rm -rf /)',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })
  })

  describe('XSS Detection', () => {
    test('should detect script tag injection', () => {
      const payload = {
        comment: "<script>alert('XSS')</script>",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })

    test('should detect event handler injection', () => {
      const payload = {
        name: '<img src=x onerror=alert(1)>',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect javascript: protocol', () => {
      const payload = {
        link: 'javascript:alert(document.cookie)',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect iframe injection', () => {
      const payload = {
        content: "<iframe src='https://evil.com'></iframe>",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })
  })

  describe('Code Injection Detection', () => {
    test('should detect eval() usage', () => {
      const payload = {
        code: "eval('malicious code')",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })

    test('should detect Function constructor', () => {
      const payload = {
        expression: "Function('return process')();",
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })
  })

  describe('Valid Inputs', () => {
    test('should allow normal text', () => {
      const payload = {
        message: 'Hello, this is a normal message!',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })

    test('should allow emails', () => {
      const payload = {
        email: 'user@example.com',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })

    test('should allow normal user data', () => {
      const payload = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })
  })

  describe('Performance', () => {
    test('should validate quickly', () => {
      const payload = { text: 'Normal text input' }

      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        validator.validate(payload)
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(200) // 1000 validations in <200ms
    })
  })
})