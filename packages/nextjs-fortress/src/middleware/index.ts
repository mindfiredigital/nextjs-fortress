// middleware/index.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  FortressConfig,
  MiddlewareFunction,
  SelectiveFortressOptions,
} from '../types'
import { FortressLogger } from '../utils/logger'
import { RequestValidator } from './requestValidator'
import { RateLimiter } from './rateLimiter'
import { SecurityHeadersHandler } from './securityHeaders'
import { WhitelistChecker } from './whiteList'
import { matchesPattern } from '../utils/patternMatchFunction'

export function createFortressMiddleware(
  config: FortressConfig,
  nextHandler?: MiddlewareFunction
) {
  const logger = new FortressLogger(config.logging)
  const validator = new RequestValidator(config, logger)
  const rateLimiter = new RateLimiter(config)
  const headersHandler = new SecurityHeadersHandler(config)
  const whitelistChecker = new WhitelistChecker(config)

  return async function fortressMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    if (!config.enabled || whitelistChecker.isWhitelisted(request)) {
      return nextHandler ? await nextHandler(request) : NextResponse.next()
    }

    const startTime = Date.now()

    try {
      if (config.modules.rateLimit.enabled) {
        const rateLimitResult = await rateLimiter.check(request)
        if (!rateLimitResult.allowed && rateLimitResult.response) {
          return rateLimitResult.response
        }
      }

      const validationResult = await validator.validate(request)
      if (!validationResult.allowed && validationResult.response) {
        return validationResult.response
      }

      const response = nextHandler
        ? await nextHandler(request)
        : NextResponse.next()

      headersHandler.addHeaders(response)

      if (config.mode === 'development') {
        logger.debug(
          `✓ Request processed in ${Date.now() - startTime}ms: ${request.method} ${request.nextUrl.pathname}`
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
 * Creates Fortress middleware that only protects specific paths
 *
 * @example
 * ```typescript
 * import { createSelectiveFortressMiddleware } from '@mindfiredigital/nextjs-fortress'
 *
 * async function myMiddleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   response.headers.set('x-custom', 'value')
 *   return response
 * }
 *
 * export const middleware = createSelectiveFortressMiddleware(
 *   fortressConfig,
 *   {
 *     protectedPaths: ['/api/admin/*', '/api/auth/*'],
 *     excludedPaths: ['/api/health'],
 *     customMiddleware: myMiddleware
 *   }
 * )
 * ```
 */
export function createSelectiveFortressMiddleware(
  config: FortressConfig,
  options: SelectiveFortressOptions
) {
  // Validate options
  if (!options.protectedPaths || options.protectedPaths.length === 0) {
    throw new Error(
      'createSelectiveFortressMiddleware requires at least one protectedPath'
    )
  }

  const fortress = createFortressMiddleware(config)
  const logger = new FortressLogger(config.logging)

  return async function selectiveMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const path = request.nextUrl.pathname

    // 1. Check if path is explicitly excluded
    if (options.excludedPaths && options.excludedPaths.length > 0) {
      const isExcluded = options.excludedPaths.some((pattern) =>
        matchesPattern(path, pattern)
      )

      if (isExcluded) {
        if (config.mode === 'development') {
          logger.debug(`⊘ Path excluded from Fortress: ${path}`)
        }

        return options.customMiddleware
          ? await options.customMiddleware(request)
          : NextResponse.next()
      }
    }

    // 2. Check if path needs Fortress protection
    const needsProtection = options.protectedPaths.some((pattern) =>
      matchesPattern(path, pattern)
    )

    if (needsProtection) {
      if (config.mode === 'development') {
        logger.debug(`🛡️ Fortress protecting: ${path}`)
      }

      // Run Fortress validation
      const fortressResponse = await fortress(request)

      // If Fortress blocked the request (4xx or 5xx), return immediately
      if (fortressResponse.status >= 400) {
        return fortressResponse
      }

      if (options.customMiddleware) {
        return await options.customMiddleware(request)
      }

      return fortressResponse
    }

    // 3. Path doesn't need protection, just run custom middleware
    if (config.mode === 'development') {
      logger.debug(`→ Path not protected: ${path}`)
    }

    return options.customMiddleware
      ? await options.customMiddleware(request)
      : NextResponse.next()
  }
}
