// middleware.ts - Next.js middleware integration for Fortress

import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig, SecurityEvent , InternalValidationResult , BodyValidator } from './types'
import { createDeserializationValidator } from './validators/deserialization'
import { createInjectionValidator } from './validators/injection'
import { createEncodingValidator } from './validators/encoding'
import { createCSRFValidator } from './validators/csrf'
import { createSecurityEvent } from './utils/securityEvent'
import { FortressLogger } from './utils/logger'
import { ValidationResult, SecurityThreatType } from './types'

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Main Fortress middleware creator
 */
export function createFortressMiddleware(config: FortressConfig) {
  const logger = new FortressLogger(config.logging)

  // Use 'as any' here only if the validator return types are strictly synchronous
  // and cannot be changed to Promise easily.
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  ) as unknown as BodyValidator
  const injectionValidator = createInjectionValidator(
    config.modules.injection
  ) as unknown as BodyValidator

  const encodingValidator = createEncodingValidator(config.modules.encoding)
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null

  return async function fortressMiddleware(request: NextRequest) {
    if (!config.enabled || isWhitelisted(request, config)) {
      return NextResponse.next()
    }

    const startTime = Date.now()

    try {
      // 1. Rate Limiting
      if (config.modules.rateLimit.enabled) {
        const rateLimitResult = await checkRateLimit(request, config)
        if (!rateLimitResult.allowed) {
          const event = createSecurityEvent({
            type: 'ratelimit',
            severity: 'medium',
            message: 'Rate limit exceeded',
            request,
            rule: 'rate_limit',
            confidence: 1.0,
          })
          await handleSecurityEvent(event, config, logger)
          return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
              'Retry-After': String(
                Math.ceil(rateLimitResult.retryAfter / 1000)
              ),
            },
          })
        }
      }

      // 2. CSRF Fix: Pass exact arguments required by the validator
      if (csrfValidator) {
        const token =
          request.headers.get('x-csrf-token') ||
          request.cookies.get('csrf-token')?.value
        const sessionId =
          request.cookies.get('session-id')?.value || 'anonymous'
        const method = request.method

        const csrfResult = await csrfValidator.validate(
          token,
          sessionId,
          method
        )
        if (!csrfResult.valid) {
          const event = createSecurityEvent({
            type: 'csrf',
            severity: 'high',
            message: csrfResult.message || 'CSRF validation failed',
            request,
            rule: 'csrf_protection',
            confidence: 1.0,
          })
          await handleSecurityEvent(event, config, logger)
          return new NextResponse('Forbidden: CSRF Validation Failed', {
            status: 403,
          })
        }
      }

      // 3. Content size validation
      if (config.modules.content.enabled) {
        const contentResult = validateContent(request, config)
        if (!contentResult.valid) {
          const event = createSecurityEvent({
            type: 'content',
            severity: contentResult.severity || 'medium',
            message: contentResult.message || 'Content validation failed',
            request,
            rule: contentResult.rule || 'content_validation',
            confidence: contentResult.confidence || 0.9,
          })
          await handleSecurityEvent(event, config, logger)
          return new NextResponse('Bad Request', { status: 400 })
        }
      }

      // 3.5 Encoding validation (Ghost Mode protection)
      if (config.modules.encoding.enabled) {
        const contentType = request.headers.get('content-type')
        const bodyBuffer = await request.clone().arrayBuffer()

        const encodingResult = await encodingValidator.validate(
          contentType,
          bodyBuffer
        )

        if (!encodingResult.valid) {
          const event = createSecurityEvent({
            type: 'encoding' as SecurityThreatType,
            severity: encodingResult.severity || 'critical',
            message: encodingResult.message || 'Invalid encoding detected',
            request,
            rule: encodingResult.rule || 'encoding_validation',
            pattern: encodingResult.pattern,
            confidence: encodingResult.confidence || 1.0,
          })

          await handleSecurityEvent(event, config, logger)
          return new NextResponse('Bad Request: Encoding Validation Failed', {
            status: 400,
          })
        }
      }

      // 4. Body Validation (Injection / Deserialization)
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyResult = await validateRequestBody(
          request,
          deserializationValidator,
          injectionValidator,
          config
        )

        if (!bodyResult.valid) {
          const event = createSecurityEvent({
            type: (bodyResult as InternalValidationResult).type || 'unknown',
            severity: bodyResult.severity || 'high',
            message: bodyResult.message || 'Request validation failed',
            request,
            rule: bodyResult.rule || 'body_validation',
            pattern: bodyResult.pattern,
            confidence: bodyResult.confidence || 0.9,
          })

          await handleSecurityEvent(event, config, logger)

          return new NextResponse(
            JSON.stringify({
              error: bodyResult.message,
              rule: bodyResult.rule,
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'x-fortress-rule': bodyResult.rule || 'unknown',
              },
            }
          )
        }
      }

      const response = NextResponse.next()
      if (config.modules.securityHeaders.enabled) addSecurityHeaders(response)

      if (config.mode === 'development') {
        logger.debug(
          `✓ Validated in ${Date.now() - startTime}ms: ${request.method} ${request.nextUrl.pathname}`
        )
      }

      return response
    } catch (error) {
      logger.error('Fortress middleware error:', error)
      return config.mode === 'production'
        ? new NextResponse('Internal Server Error', { status: 500 })
        : NextResponse.next()
    }
  }
}

/**
 * Check if request is whitelisted
 */
function isWhitelisted(request: NextRequest, config: FortressConfig): boolean {
  const path = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'

  // Check whitelisted paths
  if (config.whitelist?.paths) {
    for (const whitelistedPath of config.whitelist.paths) {
      if (path.startsWith(whitelistedPath)) {
        return true
      }
    }
  }

  // Check whitelisted IPs
  if (config.whitelist?.ips && config.whitelist.ips.includes(ip)) {
    return true
  }

  return false
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
  request: NextRequest,
  config: FortressConfig
): Promise<{ allowed: boolean; retryAfter: number }> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const rateLimitConfig = config.modules.rateLimit

  if (!rateLimitConfig.byIP) {
    return { allowed: true, retryAfter: 0 }
  }

  const key = `ip:${ip}`
  const limit = rateLimitConfig.byIP
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + limit.window,
    })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      retryAfter: entry.resetAt - now,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return { allowed: true, retryAfter: 0 }
}

/**
 * Validate content size and type
 */
function validateContent(request: NextRequest, config: FortressConfig) {
  const contentLength = request.headers.get('content-length')

  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > config.modules.content.maxPayloadSize) {
      return {
        valid: false,
        severity: 'medium' as const,
        message: `Payload too large: ${size} bytes`,
        rule: 'max_payload_size',
        confidence: 1.0,
      }
    }
  }

  return { valid: true }
}

/**
 * Validate request body
 */
async function validateRequestBody(
  request: NextRequest,
  deserializationValidator: BodyValidator,
  injectionValidator: BodyValidator,
  config: FortressConfig
): Promise<ValidationResult> {
  try {
    const clonedRequest = request.clone()
    const body = await clonedRequest.text()
    if (!body) return { valid: true }

    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(body)
    } catch {
      const injectionResult = await injectionValidator.validate(body)
      if (!injectionResult.valid) {
        return {
          ...injectionResult,
          type: 'injection',
        } as InternalValidationResult
      }
      return { valid: true }
    }

    if (config.modules.deserialization.enabled) {
      const result = await deserializationValidator.validate(parsedBody)
      if (!result.valid)
        return {
          ...result,
          type: 'deserialization',
        } as InternalValidationResult
    }

    if (config.modules.injection.enabled) {
      const result = await injectionValidator.validate(parsedBody)
      if (!result.valid)
        return { ...result, type: 'injection' } as InternalValidationResult
    }

    return { valid: true }
  } catch {
    return {
      valid: false,
      severity: 'high',
      message: 'Body validation failed',
      rule: 'body_parse_error',
      confidence: 0.8,
    }
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
}

/**
 * Handle security event
 */
async function handleSecurityEvent(
  event: SecurityEvent,
  config: FortressConfig,
  logger: FortressLogger
) {
  // Log event
  logger.logSecurityEvent(event)

  // Call custom handler if provided
  if (config.onSecurityEvent) {
    try {
      await config.onSecurityEvent(event)
    } catch (error) {
      logger.error('Error in onSecurityEvent handler:', error)
    }
  }
}
