/**
 * Application-wide constants for nextjs-fortress demo
 * Centralizes all magic strings, numbers, and configuration values
 */

// ===========================
// API ENDPOINTS
// ===========================

export const API_ROUTES = {
  TEST: '/api/test',
  HEALTH: '/api/health',
} as const

// ===========================
// UI CONSTANTS
// ===========================

export const UI_CONFIG = {
  MAX_HISTORY_ITEMS: 10,
  ANIMATION_DURATION: 300, // ms
  TOAST_DURATION: 5000, // ms
  DEBOUNCE_DELAY: 300, // ms
} as const

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// ===========================
// STATUS CODES
// ===========================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ===========================
// SECURITY SEVERITY LEVELS
// ===========================

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export const SEVERITY_COLORS = {
  [SEVERITY_LEVELS.CRITICAL]: 'text-red-400',
  [SEVERITY_LEVELS.HIGH]: 'text-orange-400',
  [SEVERITY_LEVELS.MEDIUM]: 'text-yellow-400',
  [SEVERITY_LEVELS.LOW]: 'text-green-400',
} as const

export const SEVERITY_BADGE_COLORS = {
  [SEVERITY_LEVELS.CRITICAL]: 'bg-red-500/20 text-red-300',
  [SEVERITY_LEVELS.HIGH]: 'bg-orange-500/20 text-orange-300',
  [SEVERITY_LEVELS.MEDIUM]: 'bg-yellow-500/20 text-yellow-300',
  [SEVERITY_LEVELS.LOW]: 'bg-green-500/20 text-green-300',
} as const

// ===========================
// ERROR MESSAGES
// ===========================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  VALIDATION_FAILED: 'Validation failed. Please check your input.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  GENERIC: 'An unexpected error occurred. Please try again.',
} as const

// ===========================
// SUCCESS MESSAGES
// ===========================

export const SUCCESS_MESSAGES = {
  TEST_PASSED: '✅ Security test passed successfully',
  REQUEST_BLOCKED: '🛡️ Malicious request blocked',
  VALIDATION_SUCCESS: '✓ Input validated successfully',
} as const

// ===========================
// LOADING STATES
// ===========================

export const LOADING_MESSAGES = {
  TESTING: 'Testing security...',
  VALIDATING: 'Validating input...',
  PROCESSING: 'Processing request...',
} as const

// ===========================
// LOCAL STORAGE KEYS
// ===========================

export const STORAGE_KEYS = {
  TEST_HISTORY: 'fortress_test_history',
  USER_PREFERENCES: 'fortress_preferences',
  THEME: 'fortress_theme',
} as const

// ===========================
// TIME CONSTANTS
// ===========================

export const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const

// ===========================
// VALIDATION LIMITS
// ===========================

export const VALIDATION_LIMITS = {
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  MAX_INPUT_LENGTH: 10000,
  MIN_INPUT_LENGTH: 1,
  MAX_DEPTH: 10,
} as const

// ===========================
// RATE LIMITING
// ===========================

export const RATE_LIMITS = {
  DEFAULT: {
    REQUESTS: 10,
    WINDOW: 60000, // 1 minute
  },
  STRICT: {
    REQUESTS: 5,
    WINDOW: 60000,
  },
  RELAXED: {
    REQUESTS: 100,
    WINDOW: 60000,
  },
} as const

// ===========================
// APP METADATA
// ===========================

export const APP_INFO = {
  NAME: 'nextjs-fortress',
  VERSION: '0.1.0',
  DESCRIPTION: 'Security Validation Framework',
  REPOSITORY: 'https://github.com/lakinmindfire/nextjs-fortress',
  AUTHOR: 'Mindfire Digital',
} as const

// ===========================
// FEATURE FLAGS
// ===========================

export const FEATURES = {
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_EXPERIMENTAL: false,
} as const

// ===========================
// REGEX PATTERNS
// ===========================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  IP_ADDRESS: /^(\d{1,3}\.){3}\d{1,3}$/,
} as const
