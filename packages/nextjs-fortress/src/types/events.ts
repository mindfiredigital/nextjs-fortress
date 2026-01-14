// types/events.ts - Security event type definitions

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