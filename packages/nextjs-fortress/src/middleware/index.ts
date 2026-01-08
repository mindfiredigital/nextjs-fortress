// middleware/index.ts
import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig, MiddlewareFunction } from '../types'
import { FortressLogger } from '../utils/logger'
import { RequestValidator } from './requestValidator'
import { RateLimiter } from './rateLimiter'
import { SecurityHeadersHandler } from './securityHeaders'
import { WhitelistChecker } from './whiteList'

export function createFortressMiddleware(
  config: FortressConfig,
  nextHandler?: MiddlewareFunction
) {
  const logger = new FortressLogger(config.logging)
  const validator = new RequestValidator(config, logger)
  const rateLimiter = new RateLimiter(config)
  const headersHandler = new SecurityHeadersHandler(config)
  const whitelistChecker = new WhitelistChecker(config)

  return async function fortressMiddleware(request: NextRequest): Promise<NextResponse> {
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