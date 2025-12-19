// validators/rate-limit-advanced.ts - Advanced rate limiting with Redis support

import { ValidationResult, RateLimitConfig } from '../types'

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number
  resetAt: number
  backoffMultiplier?: number
}

/**
 * Rate limit storage interface
 */
interface RateLimitStorage {
  get(key: string): Promise<RateLimitEntry | null>
  set(key: string, entry: RateLimitEntry): Promise<void>
  delete(key: string): Promise<void>
  cleanup(): Promise<number>
}

/**
 * In-memory storage implementation
 */
class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, RateLimitEntry>()

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.resetAt) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async cleanup(): Promise<number> {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

/**
 * Redis storage implementation (optional)
 */
class RedisStorage implements RateLimitStorage {
  private client: any

  constructor(redisClient: any) {
    this.client = redisClient
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.client.get(`fortress:ratelimit:${key}`)
      if (!data) return null

      return JSON.parse(data)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      const ttl = Math.ceil((entry.resetAt - Date.now()) / 1000)
      await this.client.setex(
        `fortress:ratelimit:${key}`,
        ttl,
        JSON.stringify(entry)
      )
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(`fortress:ratelimit:${key}`)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async cleanup(): Promise<number> {
    // Redis automatically cleans up expired keys
    return 0
  }
}

/**
 * Advanced rate limiter with multiple strategies
 */
export class AdvancedRateLimiter {
  private config: RateLimitConfig
  private storage: RateLimitStorage

  constructor(config: RateLimitConfig, storage?: RateLimitStorage) {
    this.config = config
    this.storage = storage || new MemoryStorage()
  }

  /**
   * Check rate limit for a request
   */
  async check(
    ip: string,
    sessionId?: string,
    endpoint?: string
  ): Promise<{ allowed: boolean; retryAfter: number; reason?: string }> {
    if (!this.config.enabled) {
      return { allowed: true, retryAfter: 0 }
    }

    const now = Date.now()
    const checks: Array<{ key: string; limit: any; type: string }> = []

    // 1. IP-based rate limit
    if (this.config.byIP) {
      checks.push({
        key: `ip:${ip}`,
        limit: this.config.byIP,
        type: 'IP',
      })
    }

    // 2. Session-based rate limit
    if (this.config.bySession && sessionId) {
      checks.push({
        key: `session:${sessionId}`,
        limit: this.config.bySession,
        type: 'Session',
      })
    }

    // 3. Endpoint-specific rate limit
    if (endpoint && this.config.endpoints?.[endpoint]) {
      checks.push({
        key: `endpoint:${endpoint}:${ip}`,
        limit: this.config.endpoints[endpoint],
        type: 'Endpoint',
      })
    }

    // Check all limits
    for (const check of checks) {
      const result = await this.checkLimit(check.key, check.limit, now)
      if (!result.allowed) {
        return {
          allowed: false,
          retryAfter: result.retryAfter,
          reason: `${check.type} rate limit exceeded`,
        }
      }
    }

    return { allowed: true, retryAfter: 0 }
  }

  /**
   * Check a specific limit
   */
  private async checkLimit(
    key: string,
    limit: { requests: number; window: number },
    now: number
  ): Promise<{ allowed: boolean; retryAfter: number }> {
    // Check whitelist
    if (this.isWhitelisted(key)) {
      return { allowed: true, retryAfter: 0 }
    }

    const entry = await this.storage.get(key)

    // No existing entry - create new
    if (!entry || now > entry.resetAt) {
      await this.storage.set(key, {
        count: 1,
        resetAt: now + limit.window,
        backoffMultiplier: 1,
      })
      return { allowed: true, retryAfter: 0 }
    }

    // Check if limit exceeded
    if (entry.count >= limit.requests) {
      // Apply exponential backoff if configured
      const backoffMultiplier = this.getBackoffMultiplier(entry)
      const retryAfter = (entry.resetAt - now) * backoffMultiplier

      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter),
      }
    }

    // Increment count
    entry.count++
    await this.storage.set(key, entry)

    return { allowed: true, retryAfter: 0 }
  }

  /**
   * Get exponential backoff multiplier
   */
  private getBackoffMultiplier(entry: RateLimitEntry): number {
    // No backoff configured
    if (!this.config.backoff?.enabled) {
      return 1
    }

    const multiplier = this.config.backoff.multiplier || 2
    const maxDelay = this.config.backoff.maxDelay || 3600000 // 1 hour
    const currentMultiplier = entry.backoffMultiplier || 1

    // Calculate next multiplier
    const nextMultiplier = Math.min(
      currentMultiplier * multiplier,
      maxDelay / (entry.resetAt - Date.now())
    )

    // Update entry with new multiplier
    entry.backoffMultiplier = nextMultiplier

    return currentMultiplier
  }

  /**
   * Check if key is whitelisted
   */
  private isWhitelisted(key: string): boolean {
    if (!this.config.whitelist) return false

    // Extract IP from key
    const ipMatch = key.match(/ip:(.+)/)
    if (ipMatch && this.config.whitelist.includes(ipMatch[1])) {
      return true
    }

    return false
  }

  /**
   * Reset rate limit for a key
   */
  async reset(ip: string, sessionId?: string): Promise<void> {
    if (this.config.byIP) {
      await this.storage.delete(`ip:${ip}`)
    }

    if (sessionId && this.config.bySession) {
      await this.storage.delete(`session:${sessionId}`)
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus(
    ip: string,
    sessionId?: string
  ): Promise<{
    remaining: number
    limit: number
    resetAt: number
  } | null> {
    const key = sessionId ? `session:${sessionId}` : `ip:${ip}`
    const limit = sessionId ? this.config.bySession : this.config.byIP

    if (!limit) return null

    const entry = await this.storage.get(key)

    if (!entry || Date.now() > entry.resetAt) {
      return {
        remaining: limit.requests,
        limit: limit.requests,
        resetAt: Date.now() + limit.window,
      }
    }

    return {
      remaining: Math.max(0, limit.requests - entry.count),
      limit: limit.requests,
      resetAt: entry.resetAt,
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    return await this.storage.cleanup()
  }
}

/**
 * Factory function for creating rate limiter
 */
export function createAdvancedRateLimiter(
  config: RateLimitConfig,
  redisClient?: any
): AdvancedRateLimiter {
  const storage = redisClient
    ? new RedisStorage(redisClient)
    : new MemoryStorage()
  return new AdvancedRateLimiter(config, storage)
}

/**
 * Express/Next.js middleware helper
 */
export function createRateLimitMiddleware(limiter: AdvancedRateLimiter) {
  return async (req: any, res: any, next: any) => {
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const sessionId = req.session?.id || req.cookies?.sessionId
    const endpoint = req.path

    const result = await limiter.check(ip, sessionId, endpoint)

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000))
      res.setHeader(
        'X-RateLimit-Reason',
        result.reason || 'Rate limit exceeded'
      )

      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: result.retryAfter,
        message: result.reason,
      })
    }

    // Add rate limit headers
    const status = await limiter.getStatus(ip, sessionId)
    if (status) {
      res.setHeader('X-RateLimit-Limit', status.limit)
      res.setHeader('X-RateLimit-Remaining', status.remaining)
      res.setHeader('X-RateLimit-Reset', new Date(status.resetAt).toISOString())
    }

    next()
  }
}

// Export types
export type { RateLimitEntry, RateLimitStorage }
export { MemoryStorage, RedisStorage }
