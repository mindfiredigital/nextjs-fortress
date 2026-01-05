import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig } from '../types'
import { FortressLogger } from '../utils/logger'
import { RequestValidator } from './requestValidator'
import { RateLimiter } from './rateLimiter'
import { SecurityHeadersHandler } from './securityHeaders'
import { WhitelistChecker } from './whiteList'

/**
 * Main Fortress middleware creator
 * Clean, single responsibility - orchestration only
 */
export function createFortressMiddleware(config: FortressConfig) {
  const logger = new FortressLogger(config.logging)
  const validator = new RequestValidator(config, logger)
  const rateLimiter = new RateLimiter(config)
  const headersHandler = new SecurityHeadersHandler(config)
  const whitelistChecker = new WhitelistChecker(config)
  

  return async function fortressMiddleware(request: NextRequest) {
    // Early exit for disabled or whitelisted
    if (!config.enabled || whitelistChecker.isWhitelisted(request)) {
      return NextResponse.next()
    }

    const startTime = Date.now()

    try {
      // 1. Check rate limit
      if (config.modules.rateLimit.enabled) {
        const rateLimitResult = await rateLimiter.check(request)
        if (!rateLimitResult.allowed) {
          return rateLimitResult.response
        }
      }

      // 2. Validate request (CSRF, encoding, body)
      const validationResult = await validator.validate(request)
      if (!validationResult.allowed) {
        return validationResult.response
      }

      // 3. Add security headers
      const response = NextResponse.next()
      headersHandler.addHeaders(response)

      // 4. Log success in dev mode
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
