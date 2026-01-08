// tests/wrappers/apiRoutes.test.ts

import { NextRequest, NextResponse } from 'next/server'
import { createWithFortress } from '../../src/wrappers/apiRoutes'
import { FortressConfig, DEFAULT_CONFIG, SecurityEvent } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('../../src/validators/deserialization')
jest.mock('../../src/validators/injection')
jest.mock('../../src/validators/csrf')
jest.mock('../../src/validators/encoding')
jest.mock('../../src/utils/logger')

describe('API Routes Wrapper - Orchestration Tests', () => {
  let mockConfig: FortressConfig
  let withFortress: ReturnType<typeof createWithFortress>
  let mockValidators: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock validators
    const {
      createDeserializationValidator,
    } = require('../../src/validators/deserialization')
    const {
      createInjectionValidator,
    } = require('../../src/validators/injection')
    const { createCSRFValidator } = require('../../src/validators/csrf')
    const { createEncodingValidator } = require('../../src/validators/encoding')

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

    it('should allow all methods by default', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler)

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const req = new NextRequest('http://localhost:3000/api/test', {
          method,
        })
        await protectedHandler(req)
      }

      expect(handler).toHaveBeenCalledTimes(methods.length)
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

    it('should track requests per IP', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        rateLimit: { requests: 1, window: 60000 },
      })

      const req1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })
      const req2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      })

      // First request from IP1 should succeed
      await protectedHandler(req1)
      expect(handler).toHaveBeenCalledTimes(1)

      // Second request from IP1 should be blocked
      const response1 = await protectedHandler(req1)
      expect(response1.status).toBe(429)

      // But request from IP2 should succeed (different IP)
      await protectedHandler(req2)
      expect(handler).toHaveBeenCalledTimes(2)
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

    it('should handle missing content-length header', async () => {
      const handler = jest.fn<(req: NextRequest) => Promise<NextResponse>>(
        async () => new NextResponse('OK')
      )
      const protectedHandler = withFortress(handler, {
        maxPayloadSize: 1000,
      })

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'small data',
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
