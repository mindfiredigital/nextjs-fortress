import { FortressConfig, FortressLogger } from 'nextjs-fortress'

/**
 * Fortress Security Configuration
 * Configures all security modules and logging
 */
export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',

  logging: {
    enabled: true,
    level: 'debug',
    destination: 'console',
  },

  modules: {
    // 1. Deserialization Protection (CVE-2025-55182)
    deserialization: {
      enabled: true,
      native: false,
      maxDepth: 10,
      detectCircular: true,
    },

    // 2. Injection Detection
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },

    // 3. Encoding Validation (Ghost Mode)
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },

    // 4. CSRF Protection
    csrf: {
      enabled: false, // Enable when you have sessions
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET,
    },

    // 5. Rate Limiting
    rateLimit: {
      enabled: true,
      byIP: {
        requests: 10,
        window: 60000, // 10 requests per minute
      },
    },

    // 6. Content Validation
    content: {
      enabled: true,
      maxPayloadSize: 1024 * 1024, // 1MB
    },

    // 7. Security Headers
    securityHeaders: {
      enabled: true,
    },
  },

  whitelist: {
    paths: ['/_next', '/favicon.ico'],
    ips: [],
  },

  /**
   * Security Event Handler
   * Called whenever a security threat is detected
   * Uses FortressLogger for structured logging
   */
  onSecurityEvent: async (event) => {
    // Initialize logger with current config
    const logger = new FortressLogger({
      enabled: true,
      level: 'warn', // Log security events as warnings
      destination: 'console',
    })

    // Log security event with proper formatting
    logger.warn('🚨 Security Threat Detected', {
      timestamp: event.timestamp,
      type: event.type,
      severity: event.severity,
      message: event.message,
      request: {
        method: event.request.method,
        path: event.request.path,
        ip: event.request.ip,
        userAgent: event.request.userAgent,
      },
      detection: {
        rule: event.detection.rule,
        pattern: event.detection.pattern,
        confidence: event.detection.confidence,
      },
      action: event.action,
    })

    // Log additional details in debug mode
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Full Security Event', event)
    }

    // Send to external monitoring service (optional)
    if (process.env.NODE_ENV === 'production') {
      try {
        logger.info('Security event sent to monitoring service')
      } catch (error) {
        logger.error('Failed to send security event to monitoring', error)
      }
    }
  },
}




