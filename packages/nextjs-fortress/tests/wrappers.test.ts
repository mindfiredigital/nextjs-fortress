import { NextRequest, NextResponse } from 'next/server'
import { createWithFortress } from '../src/wrappers/apiRoutes'
import { createSecureServerAction } from '../src/wrappers/serverActions'
import { FortressConfig, DEFAULT_CONFIG, SecurityEvent } from '../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('../src/validators/deserialization')
jest.mock('../src/validators/injection')
jest.mock('../src/validators/csrf')
jest.mock('../src/validators/encoding')
jest.mock('../src/utils/logger')

describe('API Routes Wrapper - Orchestration Tests', () => {
  let mockConfig: FortressConfig
  let withFortress: ReturnType<typeof createWithFortress>
  let mockValidators: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock validators with default "pass" behavior
    const {
      createDeserializationValidator,
    } = require('../src/validators/deserialization')
    const { createInjectionValidator } = require('../src/validators/injection')
    const { createCSRFValidator } = require('../src/validators/csrf')
    const { createEncodingValidator } = require('../src/validators/encoding')

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
        getHeaderName: jest.fn<() => string>(() => 'x-csrf-token'),
        getCookieName: jest.fn<() => string>(() => 'csrf-token'),
      },
      encoding: {
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
    createEncodingValidator.mockReturnValue(mockValidators.encoding)

    // Use DEFAULT_CONFIG as base and override what's needed
    mockConfig = {
      ...DEFAULT_CONFIG,
      mode: 'development',
      onSecurityEvent: jest.fn<(event: SecurityEvent) => Promise<void>>(),
    }

    withFortress = createWithFortress(mockConfig)
  })

  describe('Method Validation', () => {
    it('should block disallowed HTTP methods', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        allowedMethods: ['GET', 'POST'],
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(405)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should allow specified methods', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        allowedMethods: ['POST'],
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'content-type': 'application/json' },
      })

      await protectedHandler(req)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        rateLimit: { requests: 2, window: 60000 },
      })

      const req = new NextRequest('http://localhost:3000/api/test')

      // First two should succeed
      await protectedHandler(req)
      await protectedHandler(req)
      expect(handler).toHaveBeenCalledTimes(2)

      // Third should be rate limited
      const response = await protectedHandler(req)
      expect(response.status).toBe(429)
      expect(handler).toHaveBeenCalledTimes(2)
      expect(mockConfig.onSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ratelimit' })
      )
    })

    it('should include Retry-After header', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        rateLimit: { requests: 1, window: 5000 },
      })

      const req = new NextRequest('http://localhost:3000/api/test')

      await protectedHandler(req)
      const response = await protectedHandler(req)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeTruthy()
    })
  })

  describe('Payload Size Validation', () => {
    it('should reject oversized payloads', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        maxPayloadSize: 100,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'x'.repeat(200),
        headers: { 'content-length': '200' },
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(413)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should accept payloads within limit', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        maxPayloadSize: 1000,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'content-length': '16' },
      })

      await protectedHandler(req)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Encoding Validation Flow', () => {
    it('should call encoding validator when enabled', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'content-type': 'application/json' },
      })

      await protectedHandler(req)
      expect(mockValidators.encoding.validate).toHaveBeenCalled()
    })

    it('should block when encoding validator fails', async () => {
      mockValidators.encoding.validate.mockResolvedValueOnce({
        valid: false,
        message: 'Invalid encoding',
        rule: 'encoding_validation',
        confidence: 1.0,
      })

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'test',
        headers: { 'content-type': 'text/plain' },
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(400)
      expect(handler).not.toHaveBeenCalled()
      expect(mockConfig.onSecurityEvent).toHaveBeenCalled()
    })

    it('should skip encoding validation when disabled', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        validateEncoding: false,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'test',
      })

      await protectedHandler(req)
      expect(mockValidators.encoding.validate).not.toHaveBeenCalled()
    })
  })

  describe('Body Validation Flow', () => {
    it('should validate JSON bodies', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ username: 'test' }),
        headers: { 'content-type': 'application/json' },
      })

      await protectedHandler(req)

      expect(mockValidators.deserialization.validate).toHaveBeenCalled()
      expect(mockValidators.injection.validate).toHaveBeenCalled()
      expect(handler).toHaveBeenCalled()
    })

    it('should block when deserialization validation fails', async () => {
      mockValidators.deserialization.validate.mockReturnValueOnce({
        valid: false,
        severity: 'critical',
        message: 'Dangerous payload',
        rule: 'prototype_pollution',
      })

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ __proto__: {} }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should block when injection validation fails', async () => {
      mockValidators.injection.validate.mockReturnValueOnce({
        valid: false,
        severity: 'critical',
        message: 'SQL injection detected',
        rule: 'sql_injection',
      })

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ id: "1' OR '1'='1" }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should validate non-JSON text bodies', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'plain text data',
        headers: { 'content-type': 'text/plain' },
      })

      await protectedHandler(req)

      expect(mockValidators.injection.validate).toHaveBeenCalledWith(
        'plain text data'
      )
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('CSRF Validation Flow', () => {
    it('should validate CSRF token when required', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        requireCSRF: true,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      })

      await protectedHandler(req)

      expect(mockValidators.csrf.validate).toHaveBeenCalledWith(
        'valid-token',
        'default',
        'POST'
      )
      expect(handler).toHaveBeenCalled()
    })

    it('should block when CSRF validation fails', async () => {
      mockValidators.csrf.validate.mockResolvedValueOnce({
        valid: false,
        message: 'Invalid CSRF token',
        rule: 'csrf_validation',
      })

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        requireCSRF: true,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await protectedHandler(req)

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should skip CSRF when not required', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        requireCSRF: false,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'content-type': 'application/json' },
      })

      await protectedHandler(req)

      expect(mockValidators.csrf.validate).not.toHaveBeenCalled()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Security Event Reporting', () => {
    it('should report security events', async () => {
      mockValidators.injection.validate.mockReturnValueOnce({
        valid: false,
        severity: 'high',
        message: 'Attack detected',
        rule: 'xss_attack',
        confidence: 0.9,
      })

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>()
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ comment: '<script>alert(1)</script>' }),
        headers: { 'content-type': 'application/json' },
      })

      await protectedHandler(req)

      expect(mockConfig.onSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'injection',
          severity: 'high',
          message: 'Attack detected',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 in production mode on error', async () => {
      mockConfig.mode = 'production'
      withFortress = createWithFortress(mockConfig)

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => {
          throw new Error('Handler error')
        }
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test')

      const response = await protectedHandler(req)

      expect(response.status).toBe(500)
    })

    it('should throw error in development mode', async () => {
      mockConfig.mode = 'development'
      withFortress = createWithFortress(mockConfig)

      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => {
          throw new Error('Handler error')
        }
      )
      const protectedHandler = withFortress(handler)

      const req = new NextRequest('http://localhost:3000/api/test')

      await expect(protectedHandler(req)).rejects.toThrow('Handler error')
    })
  })
})

describe('Server Actions Wrapper - Orchestration Tests', () => {
  let mockConfig: FortressConfig
  let secureServerAction: ReturnType<typeof createSecureServerAction>
  let mockValidators: any

  beforeEach(() => {
    jest.clearAllMocks()

    const {
      createDeserializationValidator,
    } = require('../src/validators/deserialization')
    const { createInjectionValidator } = require('../src/validators/injection')
    const { createCSRFValidator } = require('../src/validators/csrf')

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
      // Check that __proto__ is not an own property (it was removed)
      expect(
        Object.prototype.hasOwnProperty.call(callArg.user.profile, '__proto__')
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
  })
})
