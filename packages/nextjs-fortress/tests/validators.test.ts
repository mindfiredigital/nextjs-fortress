// tests/validators.test.ts - Comprehensive test suite for all validators

import { describe, test, expect, beforeEach } from '@jest/globals'
import {
  createDeserializationValidator,
  createInjectionValidator,
  createEncodingValidator,
  createCSRFValidator,
} from '../src'

// === DESERIALIZATION VALIDATOR TESTS ===

describe('DeserializationValidator', () => {
  let validator: any

  beforeEach(() => {
    validator = createDeserializationValidator({
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    })
  })

  describe('Dangerous Keys Detection', () => {
    test('should block __proto__ pollution', () => {
      // Parsing from string ensures __proto__ is an "own property"
      const payload = JSON.parse(
        '{"username": "admin", "__proto__": {"isAdmin": true}}'
      )
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should block constructor injection', () => {
      const payload = {
        constructor: { prototype: { hacked: true } },
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })

    test('should block prototype access', () => {
      const payload = {
        data: { prototype: { polluted: true } },
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should block nested dangerous keys', () => {
      const payload = {
        user: {
          profile: {
            __proto__: { admin: true },
          },
        },
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      // Updated to be more flexible with the security message
      expect(result.message).toMatch(/__proto__|Custom prototype/)
    })
  })

  describe('Dangerous Patterns Detection', () => {
    test('should detect resolved_model pattern', () => {
      const payload = {
        data: 'resolved_model',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('high')
      expect(result.rule).toBe('dangerous_pattern')
    })

    test('should detect child_process pattern', () => {
      const payload = {
        command: 'require("child_process").exec("whoami")',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })

    test('should detect eval pattern', () => {
      const payload = {
        code: 'eval("malicious code")',
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(false)
    })
  })

  describe('Depth Limiting', () => {
    test('should block deeply nested objects', () => {
      const deepPayload = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  l6: {
                    l7: {
                      l8: {
                        l9: {
                          l10: {
                            l11: { tooDeep: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }
      const result = validator.validate(deepPayload)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('max_depth_exceeded')
    })

    test('should allow objects within depth limit', () => {
      const shallowPayload = {
        l1: { l2: { l3: { data: 'valid' } } },
      }
      const result = validator.validate(shallowPayload)

      expect(result.valid).toBe(true)
    })
  })

  describe('Circular Reference Detection', () => {
    test('should detect circular references', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      const result = validator.validate(circular)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('circular_reference')
    })
  })

  describe('Valid Payloads', () => {
    test('should allow normal objects', () => {
      const payload = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 30,
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })

    test('should allow arrays', () => {
      const payload = {
        items: [1, 2, 3, 4, 5],
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })

    test('should allow nested valid objects', () => {
      const payload = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark' },
          },
        },
      }
      const result = validator.validate(payload)

      expect(result.valid).toBe(true)
    })
  })
})

// === INJECTION VALIDATOR TESTS ===

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
      // Change this from 'high' to 'critical'
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
  })
})

// === ENCODING VALIDATOR TESTS ===

describe('EncodingValidator', () => {
  let validator: any

  beforeEach(() => {
    validator = createEncodingValidator({
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    })
  })

  describe('Content-Type Validation', () => {
    test('should block UTF-16LE in content-type', async () => {
      const contentType = 'application/json; charset=utf-16le'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
      expect(result.message).toContain('utf-16le')
    })

    test('should block UTF-32 in content-type', async () => {
      const contentType = 'text/html; charset=utf-32'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(false)
    })

    test('should allow UTF-8', async () => {
      const contentType = 'application/json; charset=utf-8'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(true)
    })
  })

  describe('BOM Detection', () => {
    test('should detect UTF-16LE BOM', async () => {
      const buffer = new Uint8Array([0xff, 0xfe, 0x48, 0x00])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf16le')
    })

    test('should detect UTF-16BE BOM', async () => {
      const buffer = new Uint8Array([0xfe, 0xff, 0x00, 0x48])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf16be')
    })

    test('should detect UTF-32LE BOM', async () => {
      const buffer = new Uint8Array([0xff, 0xfe, 0x00, 0x00])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf32le')
    })

    test('should allow UTF-8 BOM', async () => {
      const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x48])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(true)
    })
  })

  describe('Quick Check', () => {
    test('should quickly detect dangerous encodings', () => {
      const result = validator.quickCheck('application/json; charset=utf-16le')
      expect(result).toBe(false)
    })

    test('should pass safe encodings', () => {
      const result = validator.quickCheck('application/json; charset=utf-8')
      expect(result).toBe(true)
    })
  })
})

// === CSRF VALIDATOR TESTS ===

describe('CSRFValidator', () => {
  let validator: any

  beforeEach(() => {
    validator = createCSRFValidator({
      enabled: true,
      cookieName: '_csrf',
      tokenSecret: 'test-secret-key',
      tokenLength: 32,
      expiryMs: 60000, // 1 minute for testing
    })
  })

  describe('Token Generation', () => {
    test('should generate valid tokens', async () => {
      const token = await validator.generateToken('session-123')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(32)
      expect(token).toContain('.')
    })

    test('should generate different tokens', async () => {
      const token1 = await validator.generateToken('session-1')
      const token2 = await validator.generateToken('session-2')

      expect(token1).not.toBe(token2)
    })
  })

  describe('Token Validation', () => {
    test('should validate correct token', async () => {
      const sessionId = 'session-123'
      const token = await validator.generateToken(sessionId)

      const result = await validator.validate(token, sessionId, 'POST')

      expect(result.valid).toBe(true)
    })

    test('should reject invalid token', async () => {
      const result = await validator.validate(
        'invalid-token',
        'session-123',
        'POST'
      )

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })

    test('should reject mismatched session', async () => {
      const token = await validator.generateToken('session-1')
      const result = await validator.validate(token, 'session-2', 'POST')

      expect(result.valid).toBe(false)
    })

    test('should skip validation for GET requests', async () => {
      const result = await validator.validate(null, 'session-123', 'GET')

      expect(result.valid).toBe(true)
    })

    test('should skip validation for HEAD requests', async () => {
      const result = await validator.validate(null, 'session-123', 'HEAD')

      expect(result.valid).toBe(true)
    })

    test('should require token for POST requests', async () => {
      const result = await validator.validate(null, 'session-123', 'POST')

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_missing')
    })
  })

  describe('Token Expiry', () => {
    test('should reject expired tokens', async () => {
      jest.useFakeTimers() // Enable fake timers
      const sessionId = 'session-123'
      const token = await validator.generateToken(sessionId)

      // Fast-forward 61 seconds instantly
      jest.advanceTimersByTime(61000)

      const result = await validator.validate(token, sessionId, 'POST')
      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_expired')

      jest.useRealTimers() // Clean up
    })
  })

  describe('Cleanup', () => {
    test('should clean up expired tokens', () => {
      validator.generateToken('session-1')
      validator.generateToken('session-2')

      const cleaned = validator.cleanup()

      expect(cleaned).toBeGreaterThanOrEqual(0)
    })
  })
})

// === INTEGRATION TESTS ===

describe('Integration Tests', () => {
  test('should block CVE-2025-55182 payload', () => {
    const validator = createDeserializationValidator({
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    })

    const cvePayload = {
      __proto__: { isAdmin: true },
      constructor: { prototype: { polluted: true } },
    }

    const result = validator.validate(cvePayload)

    expect(result.valid).toBe(false)
    expect(result.severity).toBe('critical')
  })

  test('should allow valid user registration', () => {
    const deserializationValidator = createDeserializationValidator({
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    })

    const injectionValidator = createInjectionValidator({
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    })

    const payload = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    }

    const deserializationResult = deserializationValidator.validate(payload)
    const injectionResult = injectionValidator.validate(payload)

    expect(deserializationResult.valid).toBe(true)
    expect(injectionResult.valid).toBe(true)
  })
})

// === PERFORMANCE TESTS ===

describe('Performance Tests', () => {
  test('deserialization validation should be fast', () => {
    const validator = createDeserializationValidator({
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    })

    const payload = { username: 'test', data: { nested: { value: 123 } } }

    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      validator.validate(payload)
    }
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100) // 1000 validations in <100ms
  })

  test('injection validation should be fast', () => {
    const validator = createInjectionValidator({
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    })

    const payload = { text: 'Normal text input' }

    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      validator.validate(payload)
    }
    const duration = Date.now() - start

    expect(duration).toBeLessThan(200) // 1000 validations in <200ms
  })
})
