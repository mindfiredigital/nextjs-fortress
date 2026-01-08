// tests/validators/deserialization.test.ts

import { describe, test, expect, beforeEach } from '@jest/globals'
import { createDeserializationValidator } from '../../src'

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

  describe('CVE-2025-55182 Protection', () => {
    test('should block CVE-2025-55182 payload', () => {
      const cvePayload = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { polluted: true } },
      }

      const result = validator.validate(cvePayload)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
    })
  })

  describe('Performance', () => {
    test('should validate quickly', () => {
      const payload = { username: 'test', data: { nested: { value: 123 } } }

      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        validator.validate(payload)
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100) // 1000 validations in <100ms
    })
  })
})
