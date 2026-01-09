// types/index.ts - Core type definitions for nextjs-fortress

import { NextRequest, NextResponse } from 'next/server'

/**
 * Severity levels for security events
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Types of security threats
 */
export type SecurityThreatType =
  | 'deserialization'
  | 'injection'
  | 'encoding'
  | 'csrf'
  | 'ratelimit'
  | 'content'
  | 'headers'
  | 'unknown'

/**
 * Actions taken when threat is detected
 */
export type SecurityAction = 'blocked' | 'logged' | 'monitored'

/**
 * Security event that gets logged/reported
 */
export interface SecurityEvent {
  id: string
  timestamp: Date
  type: SecurityThreatType
  severity: SecuritySeverity
  message: string
  request: {
    method: string
    path: string
    ip: string
    userAgent: string
    referer?: string
  }
  payload?: {
    size: number
    contentType: string
    snippet: string
  }
  detection: {
    rule: string
    pattern?: string
    confidence: number
  }
  action: SecurityAction
  context?: Record<string, unknown>
}

/**
 * Validation result from any validator
 */
export interface ValidationResult {
  valid: boolean
  severity?: SecuritySeverity
  message?: string
  rule?: string
  pattern?: string
  confidence?: number
}

/**
 * Deserialization validation configuration
 */
export interface DeserializationConfig {
  enabled: boolean
  native?: boolean
  maxDepth: number
  detectCircular: boolean
  blockList?: string[]
  dangerousPatterns?: string[]
}

/**
 * Injection detection configuration
 */
export interface InjectionConfig {
  enabled: boolean
  checks: Array<'sql' | 'command' | 'xss' | 'codeInjection'>
  customPatterns?: RegExp[]
}

/**
 * Encoding validation configuration
 */
export interface EncodingConfig {
  enabled: boolean
  blockNonUTF8: boolean
  detectBOM: boolean
  allowedEncodings?: string[]
}

/**
 * CSRF protection configuration
 */
export interface CSRFConfig {
  enabled: boolean
  tokenSecret?: string
  cookieName: string
  headerName?: string
  tokenLength?: number
  expiryMs?: number
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean
  byIP?: {
    requests: number
    window: number
  }
  bySession?: {
    requests: number
    window: number
  }
  endpoints?: Record<string, { requests: number; window: number }>
  whitelist?: string[]
  backoff?: {
    enabled: boolean
    multiplier?: number
    maxDelay?: number
  }
}

/**
 * Content validation configuration
 */
export interface ContentConfig {
  enabled: boolean
  maxPayloadSize: number
  expectedContentTypes?: string[]
  requiredHeaders?: string[]
  forbiddenHeaders?: string[]
}

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  enabled: boolean
  headers?: Record<string, string>
  cors?: {
    allowedOrigins: string[]
    methods: string[]
    credentials: boolean
  }
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean
  level: 'debug' | 'info' | 'warn' | 'error'
  destination: 'console' | 'file' | 'external'
  externalEndpoint?: string
}

/**
 * Main Fortress configuration
 */
export interface FortressConfig {
  enabled: boolean
  mode: 'development' | 'staging' | 'production'
  logging: LoggingConfig

  modules: {
    deserialization: DeserializationConfig
    injection: InjectionConfig
    encoding: EncodingConfig
    csrf: CSRFConfig
    rateLimit: RateLimitConfig
    content: ContentConfig
    securityHeaders: SecurityHeadersConfig
  }

  whitelist?: {
    paths?: string[]
    ips?: string[]
  }

  onSecurityEvent?: (event: SecurityEvent) => void | Promise<void>

  performance?: {
    useNativeAddon?: boolean
    cacheValidationResults?: boolean
    cacheTTL?: number
  }
}

/**
 * Default safe configuration
 */
export const DEFAULT_CONFIG: FortressConfig = {
  enabled: true,
  mode: 'production',
  logging: {
    enabled: true,
    level: 'warn',
    destination: 'console',
  },
  modules: {
    deserialization: {
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    },
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },
    csrf: {
      enabled: true,
      cookieName: '_csrf',
      headerName: 'X-CSRF-Token',
      tokenLength: 32,
      expiryMs: 24 * 60 * 60 * 1000, // 24 hours
    },
    rateLimit: {
      enabled: true,
      byIP: { requests: 100, window: 60000 },
      bySession: { requests: 50, window: 60000 },
    },
    content: {
      enabled: true,
      maxPayloadSize: 1024 * 1024, // 1MB
    },
    securityHeaders: {
      enabled: true,
    },
  },
  whitelist: {
    paths: ['/_next', '/api/health', '/favicon.ico'],
    ips: [],
  },
  performance: {
    useNativeAddon: false,
    cacheValidationResults: true,
    cacheTTL: 3600000, // 1 hour
  },
}

// export type InternalValidationResult = ValidationResult & {
//   type?: SecurityThreatType
// }

export interface BodyValidator {
  validate(data: unknown): Promise<ValidationResult> | ValidationResult
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

export type BodyValidationResult =
  | {
      valid: true
      type?: never
      severity?: never
      message?: never
      rule?: never
      pattern?: never
      confidence?: never
    }
  | {
      valid: false
      type: SecurityThreatType
      severity?: SecuritySeverity
      message?: string
      rule?: string
      pattern?: string
      confidence?: number
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

export interface InternalValidationResult {
  allowed: boolean
  response?: NextResponse
}

// Type-safe validation error details
export interface ValidationError {
  severity: SecuritySeverity
  message: string
  rule: string
  pattern?: string
  confidence: number
}

export interface RateLimitResult {
  allowed: boolean
  response?: NextResponse
}

export type MiddlewareFunction = (
  req: NextRequest
) => NextResponse | Promise<NextResponse>
