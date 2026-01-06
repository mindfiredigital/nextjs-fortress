import { NextRequest, NextResponse } from 'next/server'
import { FortressConfig, RateLimitEntry, RateLimitResult } from '../types'

/**
 * Rate limiter - isolated rate limiting logic of middleware
 */
export class RateLimiter {
  private config: FortressConfig
  private store = new Map<string, RateLimitEntry>()

  constructor(config: FortressConfig) {
    this.config = config
  }

  async check(request: NextRequest): Promise<RateLimitResult> {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const rateLimitConfig = this.config.modules.rateLimit

    if (!rateLimitConfig.byIP) {
      return { allowed: true }
    }

    const key = `ip:${ip}`
    const limit = rateLimitConfig.byIP
    const entry = this.store.get(key)

    // Create new entry
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + limit.window,
      })
      return { allowed: true }
    }

    // Check if limit exceeded
    if (entry.count >= limit.requests) {
      return {
        allowed: false,
        response: new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        }),
      }
    }

    // Increment count
    entry.count++
    this.store.set(key, entry)

    return { allowed: true }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }
}
