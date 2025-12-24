// index.ts - Main exports for nextjs-fortress package

import { DEFAULT_CONFIG, FortressConfig } from './types'

export { createFortressMiddleware } from './middleware'

// Export middleware components (for advanced usage)
export { RequestValidator } from './middleware/requestValidator'
export { RateLimiter } from './middleware/rateLimiter'
export { SecurityHeadersHandler } from './middleware/securityHeaders'
export { WhitelistChecker } from './middleware/whitelist'

// Wrappers for Server Actions and API Routes
export {
  createSecureServerAction,
  secureServerAction,
} from './wrappers/serverActions'
export { createWithFortress, withFortress } from './wrappers/apiRoutes'

export type {
  FortressConfig,
  SecurityEvent,
  ValidationResult,
  SecuritySeverity,
  SecurityThreatType,
  SecurityAction,
  DeserializationConfig,
  InjectionConfig,
  EncodingConfig,
  CSRFConfig,
  RateLimitConfig,
  ContentConfig,
  SecurityHeadersConfig,
  LoggingConfig,
} from './types'

export { DEFAULT_CONFIG } from './types'

export { createDeserializationValidator } from './validators/deserialization'
export { createInjectionValidator } from './validators/injection'
export { createEncodingValidator } from './validators/encoding'
export { createCSRFValidator } from './validators/csrf'

export { FortressLogger } from './utils/logger'
export { createSecurityEvent } from './utils/securityEvent'

/**
 * Version information
 */
export const VERSION = '0.1.0'

/**
 * Quick initialization helper
 */
export function createDefaultConfig(
  overrides?: Partial<FortressConfig>
): FortressConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    modules: {
      ...DEFAULT_CONFIG.modules,
      ...(overrides?.modules || {}),
    },
  }
}
