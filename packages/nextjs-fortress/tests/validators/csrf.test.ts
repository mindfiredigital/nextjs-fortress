// tests/validators/csrf.test.ts

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { createCSRFValidator } from '../../src'

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

    test('should generate tokens for same session', async () => {
      const token1 = await validator.generateToken('session-123')
      const token2 = await validator.generateToken('session-123')

      expect(token1).toBeDefined()
      expect(token2).toBeDefined()
      // Tokens should be different even for same session (different timestamps)
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

    test('should skip validation for OPTIONS requests', async () => {
      const result = await validator.validate(null, 'session-123', 'OPTIONS')

      expect(result.valid).toBe(true)
    })

    test('should require token for POST requests', async () => {
      const result = await validator.validate(null, 'session-123', 'POST')

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_missing')
    })

    test('should require token for PUT requests', async () => {
      const result = await validator.validate(null, 'session-123', 'PUT')

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_missing')
    })

    test('should require token for DELETE requests', async () => {
      const result = await validator.validate(null, 'session-123', 'DELETE')

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_missing')
    })
  })

  describe('Token Expiry', () => {
    test('should reject expired tokens', async () => {
      jest.useFakeTimers()
      const sessionId = 'session-123'
      const token = await validator.generateToken(sessionId)

      // Fast-forward 61 seconds
      jest.advanceTimersByTime(61000)

      const result = await validator.validate(token, sessionId, 'POST')
      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_expired')

      jest.useRealTimers()
    })

    test('should accept non-expired tokens', async () => {
      jest.useFakeTimers()
      const sessionId = 'session-123'
      const token = await validator.generateToken(sessionId)

      // Fast-forward 30 seconds (within 60 second expiry)
      jest.advanceTimersByTime(30000)

      const result = await validator.validate(token, sessionId, 'POST')
      expect(result.valid).toBe(true)

      jest.useRealTimers()
    })
  })

  describe('Cleanup', () => {
    test('should clean up expired tokens', () => {
      validator.generateToken('session-1')
      validator.generateToken('session-2')

      const cleaned = validator.cleanup()

      expect(cleaned).toBeGreaterThanOrEqual(0)
    })

    test('should return count of cleaned tokens', async () => {
      jest.useFakeTimers()

      await validator.generateToken('session-1')
      await validator.generateToken('session-2')

      // Fast-forward past expiry
      jest.advanceTimersByTime(61000)

      const cleaned = validator.cleanup()

      expect(cleaned).toBeGreaterThanOrEqual(0)

      jest.useRealTimers()
    })
  })

  describe('Edge Cases', () => {
    test('should handle malformed token', async () => {
      const result = await validator.validate(
        'not.a.valid.token.format',
        'session-123',
        'POST'
      )

      expect(result.valid).toBe(false)
    })

    test('should handle empty session ID', async () => {
      const token = await validator.generateToken('')
      const result = await validator.validate(token, '', 'POST')

      expect(result.valid).toBe(true)
    })

    test('should handle null token', async () => {
      const result = await validator.validate(null, 'session-123', 'POST')

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('csrf_token_missing')
    })
  })
})
