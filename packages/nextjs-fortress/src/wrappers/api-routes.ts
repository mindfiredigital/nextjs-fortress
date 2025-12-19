// wrappers/api-routes.ts - Secure API Routes wrapper

import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig } from '../types'
import { createDeserializationValidator } from '../validators/deserialization'
import { createInjectionValidator } from '../validators/injection'
import { createCSRFValidator } from '../validators/csrf'
import { createEncodingValidator } from '../validators/encoding'
import { FortressLogger } from '../utils/logger'
import { createSecurityEvent } from '../utils/security-event'

/**
 * Options for securing an API route
 */
interface SecureRouteOptions {
  requireCSRF?: boolean
  rateLimit?: {
    requests: number
    window: number
  }
  maxPayloadSize?: number
  allowedMethods?: string[]
  validateEncoding?: boolean
}

/**
 * Rate limit store for API routes
 */
const apiRateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Create a secure API route wrapper
 */
export function createWithFortress(config: FortressConfig) {
  const logger = new FortressLogger(config.logging)
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  )
  const injectionValidator = createInjectionValidator(config.modules.injection)
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null
  const encodingValidator = createEncodingValidator(config.modules.encoding)

  /**
   * Wrap an API route handler with security validation
   */
  return function withFortress(
    handler: (request: NextRequest) => Promise<Response>,
    options: SecureRouteOptions = {}
  ) {
    return async function securedHandler(
      request: NextRequest
    ): Promise<Response> {
      const startTime = Date.now()

      try {
        // 1. Check allowed methods
        if (options.allowedMethods) {
          if (!options.allowedMethods.includes(request.method)) {
            return new NextResponse('Method Not Allowed', { status: 405 })
          }
        }

        // 2. Rate limiting (if specified)
        if (options.rateLimit) {
          const rateLimitResult = checkRateLimit(request, options.rateLimit)
          if (!rateLimitResult.allowed) {
            const event = createSecurityEvent({
              type: 'ratelimit',
              severity: 'medium',
              message: 'Rate limit exceeded for API route',
              request,
              rule: 'api_rate_limit',
              confidence: 1.0,
            })

            await config.onSecurityEvent?.(event)

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

        // 3. Payload size check
        const contentLength = request.headers.get('content-length')
        const maxSize =
          options.maxPayloadSize || config.modules.content.maxPayloadSize

        if (contentLength && parseInt(contentLength) > maxSize) {
          return new NextResponse('Payload Too Large', { status: 413 })
        }

        // 4. Encoding validation (Ghost Mode protection)
        if (
          options.validateEncoding !== false &&
          config.modules.encoding.enabled
        ) {
          const contentType = request.headers.get('content-type')
          const body = await request.clone().arrayBuffer()

          const encodingResult = await encodingValidator.validate(
            contentType,
            body
          )
          if (!encodingResult.valid) {
            const event = createSecurityEvent({
              type: 'encoding',
              severity: 'critical',
              message: encodingResult.message || 'Invalid encoding',
              request,
              rule: encodingResult.rule || 'encoding_validation',
              confidence: encodingResult.confidence || 1.0,
            })

            await config.onSecurityEvent?.(event)

            return new NextResponse('Bad Request: Invalid Encoding', {
              status: 400,
            })
          }
        }

        // 5. Parse and validate request body
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const validationResult = await validateRequestBody(
            request,
            deserializationValidator,
            injectionValidator,
            config,
            logger
          )

          if (!validationResult.valid) {
            const event = createSecurityEvent({
              type: validationResult.type || 'unknown',
              severity: validationResult.severity || 'high',
              message: validationResult.message || 'Validation failed',
              request,
              rule: validationResult.rule || 'body_validation',
              pattern: validationResult.pattern,
              confidence: validationResult.confidence || 0.9,
            })

            await config.onSecurityEvent?.(event)

            return new NextResponse('Forbidden', { status: 403 })
          }
        }

        // 6. CSRF validation (if required)
        if (options.requireCSRF && csrfValidator) {
          const csrfToken =
            request.headers.get(csrfValidator.getHeaderName()) ||
            request.cookies.get(csrfValidator.getCookieName())?.value

          const sessionId = request.cookies.get('session')?.value || 'default'

          // ADD AWAIT HERE ↓
          const csrfResult = await csrfValidator.validate(
            csrfToken,
            sessionId,
            request.method
          )
          if (!csrfResult.valid) {
            const event = createSecurityEvent({
              type: 'csrf',
              severity: 'high',
              message: csrfResult.message || 'CSRF validation failed',
              request,
              rule: csrfResult.rule || 'csrf_validation',
              confidence: csrfResult.confidence || 1.0,
            })

            await config.onSecurityEvent?.(event)

            return new NextResponse('Forbidden: Invalid CSRF Token', {
              status: 403,
            })
          }
        }

        // Log successful validation
        if (config.mode === 'development') {
          const duration = Date.now() - startTime
          logger.debug(
            `✓ API route validated in ${duration}ms: ${request.method} ${request.nextUrl.pathname}`
          )
        }

        // Execute the original handler
        return await handler(request)
      } catch (error) {
        logger.error('API route security error:', error)

        if (config.mode === 'production') {
          return new NextResponse('Internal Server Error', { status: 500 })
        }

        throw error
      }
    }
  }
}

/**
 * Check rate limit for API route
 */
function checkRateLimit(
  request: NextRequest,
  limit: { requests: number; window: number }
): { allowed: boolean; retryAfter: number } {
  const ip =
    (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  const path = request.nextUrl.pathname
  const key = `api:${ip}:${path}`
  const now = Date.now()

  const entry = apiRateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    apiRateLimitStore.set(key, {
      count: 1,
      resetAt: now + limit.window,
    })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit.requests) {
    return {
      allowed: false,
      retryAfter: entry.resetAt - now,
    }
  }

  entry.count++
  apiRateLimitStore.set(key, entry)

  return { allowed: true, retryAfter: 0 }
}

/**
 * Validate request body
 */
async function validateRequestBody(
  request: NextRequest,
  deserializationValidator: any,
  injectionValidator: any,
  config: FortressConfig,
  logger: FortressLogger
) {
  try {
    const clonedRequest = request.clone()
    const body = await clonedRequest.text()

    if (!body) {
      return { valid: true }
    }

    let parsedBody: any
    try {
      parsedBody = JSON.parse(body)
    } catch {
      // Not JSON, validate as text
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
 * Helper function to use in your app
 *
 * @example
 * ```typescript
 * import { withFortress } from 'nextjs-fortress';
 *
 * export const POST = withFortress(
 *   async (request) => {
 *     const data = await request.json();
 *     return Response.json({ success: true });
 *   },
 *   {
 *     rateLimit: { requests: 10, window: 60000 },
 *     requireCSRF: true,
 *   }
 * );
 * ```
 */
export function withFortress(
  handler: (request: NextRequest) => Promise<Response>,
  options?: SecureRouteOptions
): (request: NextRequest) => Promise<Response> {
  throw new Error(
    'withFortress must be created with createWithFortress(config) first'
  )
}
