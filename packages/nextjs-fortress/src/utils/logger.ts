import { LoggingConfig, SecurityEvent } from '../types'

export class FortressLogger {
  private config: LoggingConfig

  constructor(config: LoggingConfig) {
    this.config = config
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug(`[Fortress] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(`[Fortress] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[Fortress] ${message}`, ...args)
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(`[Fortress] ${message}`, ...args)
    }
  }

  logSecurityEvent(event: SecurityEvent) {
    if (!this.config.enabled) return

    const level = this.getSeverityLevel(event.severity)
    const emoji = this.getSeverityEmoji(event.severity)

    const message = `${emoji} Security Event [${event.type}] - ${event.message}`
    const details = {
      id: event.id,
      severity: event.severity,
      path: event.request.path,
      ip: event.request.ip,
      rule: event.detection.rule,
      action: event.action,
    }

    switch (level) {
      case 'error':
        this.error(message, details)
        break
      case 'warn':
        this.warn(message, details)
        break
      case 'info':
        this.info(message, details)
        break
      default:
        this.debug(message, details)
    }
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false

    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.level)
    const messageLevel = levels.indexOf(level)

    return messageLevel >= configLevel
  }

  private getSeverityLevel(
    severity: string
  ): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      case 'low':
        return 'info'
      default:
        return 'debug'
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '⚡'
      case 'low':
        return 'ℹ️'
      default:
        return '📋'
    }
  }
}
