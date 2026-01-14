// types/modules.ts - Module-specific type definitions

import { NextRequest, NextResponse } from 'next/server'

/**
 * Configuration options for selective middleware
 */
export interface SelectiveFortressOptions {
  protectedPaths: string[]
  excludedPaths?: string[]
  customMiddleware?: MiddlewareFunction
}

export interface SecureRouteOptions {
  requireCSRF?: boolean
  rateLimit?: {
    requests: number
    window: number
  }
  maxPayloadSize?: number
  allowedMethods?: string[]
  validateEncoding?: boolean
}

export interface SecureActionOptions {
  requireCSRF?: boolean
  sanitizeInputs?: boolean
  maxDepth?: number
  allowedInputs?: string[]
  rateLimitKey?: string
}

export interface CSRFToken {
  token: string
  createdAt: number
  expiresAt: number
}

export type MiddlewareFunction = (
  req: NextRequest
) => NextResponse | Promise<NextResponse>
