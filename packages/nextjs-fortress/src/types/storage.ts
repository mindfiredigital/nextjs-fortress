// types/storage.ts - Storage type definitions

/**
 * Rate limit entry
 */
export interface RateLimitEntry {
  count: number
  resetAt: number
  backoffMultiplier?: number
}

export interface RedisClient {
  get(key: string): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<void>
  del(key: string): Promise<void>
}

/**
 * Rate limit storage interface
 */
export interface RateLimitStorage {
  get(key: string): Promise<RateLimitEntry | null>
  set(key: string, entry: RateLimitEntry): Promise<void>
  delete(key: string): Promise<void>
  cleanup(): Promise<number>
}
