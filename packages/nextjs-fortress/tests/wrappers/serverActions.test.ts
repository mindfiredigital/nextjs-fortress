// tests/wrappers/serverActions.test.ts

import { createSecureServerAction } from '../../src/wrappers/serverActions'
import { FortressConfig, DEFAULT_CONFIG, SecurityEvent } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('../../src/validators/deserialization')
jest.mock('../../src/validators/injection')
jest.mock('../../src/validators/csrf')
jest.mock('../../src/utils/logger')

describe('Server Actions Wrapper - Orchestration Tests', () => {
  let mockConfig: FortressConfig
  let secureServerAction: ReturnType<typeof createSecureServerAction>
  let mockValidators: any

  beforeEach(() => {
    jest.clearAllMocks()

    const {
      createDeserializationValidator,
    } = require('../../src/validators/deserialization')
    const {
      createInjectionValidator,
    } = require('../../src/validators/injection')
    const { createCSRFValidator } = require('../../src/validators/csrf')

    mockValidators = {
      deserialization: {
        validate: jest.fn<(data: unknown) => { valid: boolean }>(() => ({
          valid: true,
        })),
      },
      injection: {
        validate: jest.fn<(data: unknown) => { valid: boolean }>(() => ({
          valid: true,
        })),
      },
      csrf: {
        validate: jest.fn<() => Promise<{ valid: boolean }>>(async () => ({
          valid: true,
        })),
      },
    }

    createDeserializationValidator.mockReturnValue(
      mockValidators.deserialization
    )
    createInjectionValidator.mockReturnValue(mockValidators.injection)
    createCSRFValidator.mockReturnValue(mockValidators.csrf)

    mockConfig = {
      ...DEFAULT_CONFIG,
      mode: 'development',
      onSecurityEvent: jest.fn<(event: SecurityEvent) => Promise<void>>(),
    }

    secureServerAction = createSecureServerAction(mockConfig)
  })

  describe('Input Validation Flow', () => {
    it('should validate all arguments', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction('user123', { name: 'John' })

      expect(mockValidators.deserialization.validate).toHaveBeenCalledTimes(2)
      expect(mockValidators.injection.validate).toHaveBeenCalledTimes(2)
      expect(action).toHaveBeenCalledWith('user123', { name: 'John' })
    })

    it('should block when deserialization fails', async () => {
      mockValidators.deserialization.validate.mockReturnValueOnce({
        valid: false,
        message: 'Prototype pollution detected',
        rule: 'prototype_pollution',
      })

      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await expect(
        protectedAction({ __proto__: { isAdmin: true } })
      ).rejects.toThrow('Prototype pollution detected')

      expect(action).not.toHaveBeenCalled()
    })

    it('should block when injection validation fails', async () => {
      mockValidators.injection.validate
        .mockReturnValueOnce({ valid: true })
        .mockReturnValueOnce({
          valid: false,
          message: 'SQL injection detected',
          rule: 'sql_injection',
        })

      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await expect(protectedAction('safe-id', "1' OR '1'='1")).rejects.toThrow(
        'SQL injection detected'
      )

      expect(action).not.toHaveBeenCalled()
    })

    it('should validate complex nested objects', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      const complexData = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark' },
          },
        },
        metadata: ['tag1', 'tag2'],
      }

      await protectedAction(complexData)

      expect(mockValidators.deserialization.validate).toHaveBeenCalledWith(
        complexData
      )
      expect(action).toHaveBeenCalled()
    })
  })

  describe('CSRF Validation Flow', () => {
    it('should validate CSRF when required', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        requireCSRF: true,
      })

      await protectedAction('data', { _csrf: 'valid-token' })

      expect(mockValidators.csrf.validate).toHaveBeenCalledWith(
        'valid-token',
        expect.any(String),
        'POST'
      )
    })

    it('should block when CSRF validation fails', async () => {
      mockValidators.csrf.validate.mockResolvedValueOnce({
        valid: false,
        message: 'Invalid CSRF token',
        rule: 'csrf_token_invalid',
      })

      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        requireCSRF: true,
      })

      await expect(
        protectedAction('data', { _csrf: 'invalid' })
      ).rejects.toThrow('Invalid CSRF token')

      expect(action).not.toHaveBeenCalled()
    })

    it('should skip CSRF when not required', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        requireCSRF: false,
      })

      await protectedAction('data')

      expect(mockValidators.csrf.validate).not.toHaveBeenCalled()
      expect(action).toHaveBeenCalled()
    })

    it('should extract CSRF from different argument positions', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        requireCSRF: true,
      })

      await protectedAction({ _csrf: 'token-1' })

      expect(mockValidators.csrf.validate).toHaveBeenCalledWith(
        'token-1',
        expect.any(String),
        'POST'
      )
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize dangerous keys when enabled', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        sanitizeInputs: true,
      })

      await protectedAction({
        username: 'test',
        __proto__: { isAdmin: true },
        constructor: { polluted: true },
      })

      expect(action).toHaveBeenCalledWith({
        username: 'test',
      })
    })

    it('should sanitize nested objects', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        sanitizeInputs: true,
      })

      await protectedAction({
        user: {
          name: 'John',
          profile: {
            __proto__: { admin: true },
            bio: 'Developer',
          },
        },
      })

      const callArg = action.mock.calls[0][0]
      expect(callArg.user.name).toBe('John')
      expect(callArg.user.profile.bio).toBe('Developer')
      expect(
        Object.prototype.hasOwnProperty.call(callArg.user.profile, '__proto__')
      ).toBe(false)
    })

    it('should sanitize arrays', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        sanitizeInputs: true,
      })

      await protectedAction([
        { name: 'item1', __proto__: {} },
        { name: 'item2', constructor: {} },
      ])

      const callArg = action.mock.calls[0][0]
      expect(callArg[0].name).toBe('item1')
      expect(callArg[1].name).toBe('item2')
      expect(
        Object.prototype.hasOwnProperty.call(callArg[0], '__proto__')
      ).toBe(false)
      expect(
        Object.prototype.hasOwnProperty.call(callArg[1], 'constructor')
      ).toBe(false)
    })

    it('should not sanitize when disabled', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        sanitizeInputs: false,
      })

      const input = { username: 'test', data: { value: 123 } }
      await protectedAction(input)

      expect(action).toHaveBeenCalledWith(input)
    })

    it('should preserve non-dangerous properties', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        sanitizeInputs: true,
      })

      const input = {
        username: 'test',
        email: 'test@example.com',
        age: 25,
        hobbies: ['coding', 'gaming'],
        address: { city: 'NYC', zip: '10001' },
      }

      await protectedAction(input)

      const callArg = action.mock.calls[0][0]
      expect(callArg.username).toBe('test')
      expect(callArg.email).toBe('test@example.com')
      expect(callArg.age).toBe(25)
      expect(callArg.hobbies).toEqual(['coding', 'gaming'])
      expect(callArg.address).toEqual({ city: 'NYC', zip: '10001' })
    })
  })

  describe('Security Event Reporting', () => {
    it('should report security events on validation failure', async () => {
      mockValidators.injection.validate.mockReturnValueOnce({
        valid: false,
        message: 'XSS detected',
        rule: 'xss_attack',
      })

      const action =
        jest.fn<(...args: any[]) => Promise<{ success: boolean }>>()
      const protectedAction = secureServerAction(action)

      await expect(
        protectedAction('<script>alert(1)</script>')
      ).rejects.toThrow()

      expect(mockConfig.onSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'xss_attack',
          severity: 'high',
        })
      )
    })

    it('should include context in security events', async () => {
      mockValidators.deserialization.validate.mockReturnValueOnce({
        valid: false,
        message: 'Dangerous pattern',
        rule: 'dangerous_pattern',
        severity: 'high',
      })

      const action =
        jest.fn<(...args: any[]) => Promise<{ success: boolean }>>()
      const protectedAction = secureServerAction(action)

      await expect(protectedAction({ data: 'test' })).rejects.toThrow()

      expect(mockConfig.onSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dangerous_pattern',
          message: 'Dangerous pattern',
          severity: 'high',
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty arguments', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction()

      expect(action).toHaveBeenCalledWith()
    })

    it('should handle null arguments', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction(null, undefined)

      expect(action).toHaveBeenCalledWith(null, undefined)
    })

    it('should handle array arguments', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction([1, 2, 3], ['a', 'b'])

      expect(mockValidators.deserialization.validate).toHaveBeenCalledWith([
        1, 2, 3,
      ])
      expect(action).toHaveBeenCalled()
    })

    it('should handle primitive arguments', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction('string', 123, true)

      expect(mockValidators.deserialization.validate).toHaveBeenCalledTimes(3)
      expect(action).toHaveBeenCalledWith('string', 123, true)
    })

    it('should handle mixed argument types', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      await protectedAction(
        'id-123',
        { name: 'John' },
        [1, 2, 3],
        null,
        undefined,
        42
      )

      expect(mockValidators.deserialization.validate).toHaveBeenCalledTimes(6)
      expect(action).toHaveBeenCalled()
    })
  })

  describe('Integration Scenarios', () => {
    it('should allow valid user registration', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action)

      const payload = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      }

      await protectedAction(payload)

      expect(mockValidators.deserialization.validate).toHaveBeenCalled()
      expect(mockValidators.injection.validate).toHaveBeenCalled()
      expect(action).toHaveBeenCalledWith(payload)
    })

    it('should handle form submission with CSRF', async () => {
      const action = jest.fn<(...args: any[]) => Promise<{ success: boolean }>>(
        async () => ({ success: true })
      )
      const protectedAction = secureServerAction(action, {
        requireCSRF: true,
        sanitizeInputs: true,
      })

      await protectedAction({
        _csrf: 'valid-token',
        title: 'Post Title',
        content: 'Post content here',
      })

      expect(mockValidators.csrf.validate).toHaveBeenCalled()
      expect(action).toHaveBeenCalled()
    })
  })
})
