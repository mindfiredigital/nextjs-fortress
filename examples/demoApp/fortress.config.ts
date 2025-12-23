import { FortressConfig } from 'nextjs-fortress'

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

  onSecurityEvent: async (event) => {
    console.log('🚨 Security Event:', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      path: event.request.path,
      rule: event.detection.rule,
    })

    // Send to your monitoring service
    // await sendToSentry(event);
  },
}
