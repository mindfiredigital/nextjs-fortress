// index.ts - Main exports for nextjs-fortress package

import { FortressConfig } from './types'

export { createFortressMiddleware } from './middleware'

// Wrappers for Server Actions and API Routes
export {
  createSecureServerAction,
  secureServerAction,
} from './wrappers/server-actions'
export { createWithFortress, withFortress } from './wrappers/api-routes'

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
export { createSecurityEvent } from './utils/security-event'

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
  const { DEFAULT_CONFIG } = require('./types')
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    modules: {
      ...DEFAULT_CONFIG.modules,
      ...(overrides?.modules || {}),
    },
  }
}
