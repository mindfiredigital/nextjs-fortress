import { NextRequest } from 'next/server'
import { FortressConfig } from '../types'

/**
 * Whitelist checker - isolated whitelist logic in here
 */
export class WhitelistChecker {
  private config: FortressConfig

  constructor(config: FortressConfig) {
    this.config = config
  }

  isWhitelisted(request: NextRequest): boolean {
    const path = request.nextUrl.pathname
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'

    // Check whitelisted paths
    if (this.config.whitelist?.paths) {
      for (const whitelistedPath of this.config.whitelist.paths) {
        if (path.startsWith(whitelistedPath)) {
          return true
        }
      }
    }

    // Check whitelisted IPs
    if (this.config.whitelist?.ips && this.config.whitelist.ips.includes(ip)) {
      return true
    }

    return false
  }
}
