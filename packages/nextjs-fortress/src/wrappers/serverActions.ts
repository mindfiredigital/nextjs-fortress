// wrappers/server-actions.ts - Secure Server Actions wrapper

import {
  FortressConfig,
  SecurityThreatType,
  SecureActionOptions,
} from '../types'
import { createDeserializationValidator } from '../validators/deserialization'
import { createInjectionValidator } from '../validators/injection'
import { createCSRFValidator } from '../validators/csrf'
import { FortressLogger } from '../utils/logger'

/**
 * Create a secure server action wrapper
 */
export function createSecureServerAction(config: FortressConfig) {
  const logger = new FortressLogger(config.logging)
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  )
  const injectionValidator = createInjectionValidator(config.modules.injection)
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null

  /**
   * Wrap a server action with security validation
   */
  return function secureServerAction<TArgs extends unknown[], TReturn>(
    action: (...args: TArgs) => Promise<TReturn>,
    options: SecureActionOptions = {}
  ) {
    return async function securedAction(...args: TArgs): Promise<TReturn> {
      const startTime = Date.now()

      try {
        // 1. Validate deserialization
        if (config.modules.deserialization.enabled) {
          for (const arg of args) {
            const result = deserializationValidator.validate(arg)
            if (!result.valid) {
              logger.warn(`Server action blocked: ${result.message}`)
              throw new SecurityError(
                result.message || 'Invalid input detected',
                result.rule || 'deserialization'
              )
            }
          }
        }

        // 2. Validate injection
        if (config.modules.injection.enabled) {
          for (const arg of args) {
            const result = injectionValidator.validate(arg)
            if (!result.valid) {
              logger.warn(
                `Injection attempt in server action: ${result.message}`
              )
              throw new SecurityError(
                result.message || 'Injection detected',
                result.rule || 'injection'
              )
            }
          }
        }

        // 3. CSRF validation (if required)
        if (options.requireCSRF && csrfValidator) {
          // Extract CSRF token from args (assumes it's in metadata)
          const csrfToken = extractCSRFToken(args)
          const sessionId = extractSessionId(args)

          const result = await csrfValidator.validate(
            csrfToken,
            sessionId,
            'POST'
          )
          if (!result.valid) {
            logger.warn(`CSRF validation failed: ${result.message}`)
            throw new SecurityError(
              result.message || 'CSRF validation failed',
              result.rule || 'csrf'
            )
          }
        }

        // 4. Sanitize inputs if requested
        let sanitizedArgs = args
        if (options.sanitizeInputs) {
          sanitizedArgs = sanitizeInputs(args) as TArgs
        }

        // Log successful validation in dev mode
        if (config.mode === 'development') {
          const duration = Date.now() - startTime
          logger.debug(`✓ Server action validated in ${duration}ms`)
        }

        // Execute the original action with sanitized inputs
        return await action(...sanitizedArgs)
      } catch (error) {
        if (error instanceof SecurityError) {
          // Log security event
          const event = {
            id: generateEventId(),
            timestamp: new Date(),
            type: (error.rule as SecurityThreatType) || 'unknown',
            severity: 'high' as const,
            message: error.message,
            request: {
              method: 'POST',
              path: '/server-action',
              ip: 'unknown',
              userAgent: 'unknown',
            },
            detection: {
              rule: error.rule,
              confidence: 1.0,
            },
            action: 'blocked' as const,
          }

          await config.onSecurityEvent?.(event)

          throw error
        }
        throw error
      }
    }
  }
}

/**
 * Custom security error class
 */
class SecurityError extends Error {
  constructor(
    message: string,
    public rule: string
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

/**
 * Extract CSRF token from server action args
 */
function extractCSRFToken(args: unknown[]): string | null {
  // Check if last arg is metadata object with csrf token
  if (args.length > 0) {
    const lastArg = args[args.length - 1]
    if (typeof lastArg === 'object' && lastArg !== null && '_csrf' in lastArg) {
      return (lastArg as { _csrf: string })._csrf
    }
  }
  return null
}

/**
 * Extract session ID from server action args
 */
function extractSessionId(args: unknown[]): string {
  const metadata = args[args.length - 1]
  if (
    typeof metadata === 'object' &&
    metadata !== null &&
    'sessionId' in metadata
  ) {
    return String((metadata as { sessionId: unknown }).sessionId)
  }

  return 'default-session'
}

/**
 * Sanitize inputs by removing dangerous properties
 */
function sanitizeInputs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg === null || typeof arg !== 'object') {
      return arg
    }

    if (Array.isArray(arg)) {
      return arg.map((item) => sanitizeInputs([item])[0])
    }

    // Remove dangerous keys
    const sanitized: Record<string, unknown> = {}
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']

    const objArg = arg as Record<string, unknown>

    for (const [key, value] of Object.entries(objArg)) {
      if (!dangerousKeys.includes(key.toLowerCase())) {
        sanitized[key] =
          value !== null && typeof value === 'object'
            ? sanitizeInputs([value])[0]
            : value
      }
    }

    return sanitized
  })
}

/**
 * Generate event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper function to use in your app
 *
 * @example
 * ```typescript
 * 'use server';
 *
 * import { secureServerAction } from 'nextjs-fortress';
 *
 * export const updateUser = secureServerAction(
 *   async (userId: string, name: string) => {
 *     // Your business logic here
 *     return { success: true };
 *   },
 *   { sanitizeInputs: true, requireCSRF: false }
 * );
 * ```
 */
export function secureServerAction<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>,
  options?: SecureActionOptions
): (...args: TArgs) => Promise<TReturn> {
  const actionName = action.name || 'anonymous'
  const optsCount = Object.keys(options || {}).length

  throw new Error(
    `secureServerAction (${actionName}) with ${optsCount} options must be created with createSecureServerAction(config) first`
  )
}
