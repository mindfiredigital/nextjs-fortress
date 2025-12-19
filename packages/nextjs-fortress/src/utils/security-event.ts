import { NextRequest } from 'next/server'
import { SecurityEvent, SecurityThreatType, SecuritySeverity } from '../types'

/**
 * Create a security event from validation failure
 */
export function createSecurityEvent(params: {
  type: SecurityThreatType
  severity: SecuritySeverity
  message: string
  request: NextRequest
  rule: string
  pattern?: string
  confidence: number
  context?: Record<string, any>
}): SecurityEvent {
  const {
    type,
    severity,
    message,
    request,
    rule,
    pattern,
    confidence,
    context,
  } = params

  // Extract request details
  const method = request.method
  const path = request.nextUrl.pathname
  const ip =
    (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const referer = request.headers.get('referer') || undefined

  // Get content info if available
  const contentType = request.headers.get('content-type') || 'unknown'
  const contentLength = request.headers.get('content-length')

  return {
    id: generateEventId(),
    timestamp: new Date(),
    type,
    severity,
    message,
    request: {
      method,
      path,
      ip,
      userAgent,
      referer,
    },
    payload: contentLength
      ? {
          size: parseInt(contentLength, 10),
          contentType,
          snippet: '', // Will be filled by caller if needed
        }
      : undefined,
    detection: {
      rule,
      pattern,
      confidence,
    },
    action: 'blocked',
    context,
  }
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
