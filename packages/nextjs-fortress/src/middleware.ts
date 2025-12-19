// middleware.ts - Next.js middleware integration for Fortress

import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig, SecurityEvent } from './types'
import { createDeserializationValidator } from './validators/deserialization'
import { createInjectionValidator } from './validators/injection'
import { createEncodingValidator } from './validators/encoding'
import { createCSRFValidator } from './validators/csrf'
import { createSecurityEvent } from './utils/security-event'
import { FortressLogger } from './utils/logger'

/**
 * Rate limiting store (in-memory for now)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Main Fortress middleware creator
 */
export function createFortressMiddleware(config: FortressConfig) {
  const logger = new FortressLogger(config.logging)
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  )
  const injectionValidator = createInjectionValidator(config.modules.injection)
  const encodingValidator = createEncodingValidator(config.modules.encoding)
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null

  /**
   * The actual middleware function
   */
  return async function fortressMiddleware(request: NextRequest) {
    // Skip if disabled
    if (!config.enabled) {
      return NextResponse.next()
    }

    // Check whitelist
    if (isWhitelisted(request, config)) {
      return NextResponse.next()
    }

    const startTime = Date.now()

    try {
      // 1. Rate limiting check
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

      // 2. Content validation
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

      // 3. Encoding validation (Ghost Mode protection)
      if (config.modules.encoding.enabled) {
        const contentType = request.headers.get('content-type')
        const bodyBuffer = await request.clone().arrayBuffer()

        const encodingResult = await encodingValidator.validate(
          contentType,
          bodyBuffer
        )
        if (!encodingResult.valid) {
          const event = createSecurityEvent({
            type: 'encoding',
            severity: encodingResult.severity || 'critical',
            message: encodingResult.message || 'Invalid encoding detected',
            request,
            rule: encodingResult.rule || 'encoding_validation',
            pattern: encodingResult.pattern,
            confidence: encodingResult.confidence || 1.0,
          })

          await handleSecurityEvent(event, config, logger)

          return new NextResponse('Bad Request', { status: 400 })
        }
      }

      // 4. Parse and validate request body (for POST/PUT/PATCH)
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyResult = await validateRequestBody(
          request,
          deserializationValidator,
          injectionValidator,
          config
        )

        if (!bodyResult.valid) {
          const event = createSecurityEvent({
            type: bodyResult.type || 'unknown',
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
                'x-fortress-confidence': (
                  bodyResult.confidence || 0.9
                ).toString(),
              },
            }
          )
        }
      }

      // 5. Add security headers to response
      const response = NextResponse.next()

      if (config.modules.securityHeaders.enabled) {
        addSecurityHeaders(response, config)
      }

      // Log successful request in dev mode
      if (config.mode === 'development') {
        const duration = Date.now() - startTime
        logger.debug(
          `✓ Request validated in ${duration}ms: ${request.method} ${request.nextUrl.pathname}`
        )
      }

      return response
    } catch (error) {
      logger.error('Fortress middleware error:', error)

      // Fail closed - block on error
      if (config.mode === 'production') {
        return new NextResponse('Internal Server Error', { status: 500 })
      }

      // Fail open in development
      return NextResponse.next()
    }
  }
}

/**
 * Check if request is whitelisted
 */
function isWhitelisted(request: NextRequest, config: FortressConfig): boolean {
  const path = request.nextUrl.pathname
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || ''

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
  const ip =
    (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
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
  const contentType = request.headers.get('content-type')

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
  deserializationValidator: any,
  injectionValidator: any,
  config: FortressConfig
) {
  try {
    // Clone request to read body
    const clonedRequest = request.clone()
    const body = await clonedRequest.text()

    if (!body) {
      return { valid: true }
    }

    // Try to parse as JSON
    let parsedBody: any
    try {
      parsedBody = JSON.parse(body)
    } catch {
      // Not JSON, validate as plain text
      const injectionResult = injectionValidator.validate(body)
      if (!injectionResult.valid) {
        return {
          valid: false,
          type: 'injection' as const,
          ...injectionResult,
        }
      }
      return { valid: true }
    }

    // Validate deserialization
    if (config.modules.deserialization.enabled) {
      const deserializationResult =
        deserializationValidator.validate(parsedBody)
      if (!deserializationResult.valid) {
        return {
          valid: false,
          type: 'deserialization' as const,
          ...deserializationResult,
        }
      }
    }

    // Validate injection
    if (config.modules.injection.enabled) {
      const injectionResult = injectionValidator.validate(parsedBody)
      if (!injectionResult.valid) {
        return {
          valid: false,
          type: 'injection' as const,
          ...injectionResult,
        }
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      severity: 'high' as const,
      message: 'Body validation failed',
      rule: 'body_parse_error',
      confidence: 0.8,
    }
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, config: FortressConfig) {
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
