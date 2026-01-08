// tests/integration.test.ts

import { describe, test, expect } from '@jest/globals'
import {
  createDeserializationValidator,
  createInjectionValidator,
} from '../src'

describe('Integration Tests', () => {
  describe('CVE-2025-55182 Protection', () => {
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
  })

  describe('Valid User Registration Flow', () => {
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

  describe('Multi-Vector Attack Detection', () => {
    test('should detect combined prototype pollution and SQL injection', () => {
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

      const maliciousPayload = {
        username: "admin' OR '1'='1",
        __proto__: { isAdmin: true },
      }

      const deserializationResult =
        deserializationValidator.validate(maliciousPayload)
      const injectionResult = injectionValidator.validate(maliciousPayload)

      expect(deserializationResult.valid).toBe(false)
      expect(injectionResult.valid).toBe(false)
    })

    test('should detect XSS with prototype pollution', () => {
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

      const maliciousPayload = {
        comment: "<script>alert('XSS')</script>",
        constructor: { prototype: { hacked: true } },
      }

      const deserializationResult =
        deserializationValidator.validate(maliciousPayload)
      const injectionResult = injectionValidator.validate(maliciousPayload)

      expect(deserializationResult.valid).toBe(false)
      expect(injectionResult.valid).toBe(false)
    })
  })

  describe('Complex Nested Payloads', () => {
    test('should validate deeply nested valid payload', () => {
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

      const complexPayload = {
        user: {
          profile: {
            personal: {
              name: 'John Doe',
              email: 'john@example.com',
            },
            settings: {
              preferences: {
                theme: 'dark',
                notifications: true,
              },
            },
          },
        },
      }

      const deserializationResult =
        deserializationValidator.validate(complexPayload)
      const injectionResult = injectionValidator.validate(complexPayload)

      expect(deserializationResult.valid).toBe(true)
      expect(injectionResult.valid).toBe(true)
    })

    test('should detect malicious payload in deeply nested structure', () => {
      const deserializationValidator = createDeserializationValidator({
        enabled: true,
        native: false,
        maxDepth: 10,
        detectCircular: true,
      })

      const maliciousPayload = {
        user: {
          profile: {
            personal: {
              name: 'John',
              email: 'john@example.com',
            },
            settings: {
              __proto__: { isAdmin: true },
            },
          },
        },
      }

      const result = deserializationValidator.validate(maliciousPayload)

      expect(result.valid).toBe(false)
    })
  })

  describe('Real-World Scenarios', () => {
    test('should handle blog post creation', () => {
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

      const blogPost = {
        title: 'My First Post',
        content: 'This is a normal blog post with some content.',
        author: 'john_doe',
        tags: ['technology', 'coding'],
        metadata: {
          publishDate: '2025-01-08',
          category: 'tech',
        },
      }

      const deserializationResult = deserializationValidator.validate(blogPost)
      const injectionResult = injectionValidator.validate(blogPost)

      expect(deserializationResult.valid).toBe(true)
      expect(injectionResult.valid).toBe(true)
    })

    test('should block malicious blog post', () => {
      const injectionValidator = createInjectionValidator({
        enabled: true,
        checks: ['sql', 'command', 'xss', 'codeInjection'],
      })

      const maliciousBlogPost = {
        title: 'Malicious Post',
        content: "<script>alert('XSS')</script>",
        author: "admin' OR '1'='1",
      }

      const result = injectionValidator.validate(maliciousBlogPost)

      expect(result.valid).toBe(false)
    })

    test('should handle e-commerce cart', () => {
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

      const cart = {
        userId: 'user-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 29.99 },
          { productId: 'prod-2', quantity: 1, price: 49.99 },
        ],
        coupon: 'SAVE10',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          zip: '10001',
        },
      }

      const deserializationResult = deserializationValidator.validate(cart)
      const injectionResult = injectionValidator.validate(cart)

      expect(deserializationResult.valid).toBe(true)
      expect(injectionResult.valid).toBe(true)
    })
  })

  describe('Array Handling', () => {
    test('should validate arrays with safe objects', () => {
      const deserializationValidator = createDeserializationValidator({
        enabled: true,
        native: false,
        maxDepth: 10,
        detectCircular: true,
      })

      const payload = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ],
      }

      const result = deserializationValidator.validate(payload)

      expect(result.valid).toBe(true)
    })

    test('should detect malicious objects in arrays', () => {
      const deserializationValidator = createDeserializationValidator({
        enabled: true,
        native: false,
        maxDepth: 10,
        detectCircular: true,
      })

      const payload = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob', __proto__: { isAdmin: true } },
        ],
      }

      const result = deserializationValidator.validate(payload)

      expect(result.valid).toBe(false)
    })
  })
})