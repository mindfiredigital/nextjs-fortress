import { NextResponse } from 'next/server'
import { FortressConfig } from '../types'

/**
 * Security headers handler
 */
export class SecurityHeadersHandler {
  private config: FortressConfig

  constructor(config: FortressConfig) {
    this.config = config
  }

  addHeaders(response: NextResponse): void {
    if (!this.config.modules.securityHeaders.enabled) return

    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    }

    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }
  }
}
