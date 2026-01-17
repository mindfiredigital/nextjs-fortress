// types/validation.ts - Validation type definitions

import { NextResponse } from 'next/server'
import { SecuritySeverity, SecurityThreatType } from './events'

/**
 * Validation result from any validator
 */
export interface ValidationResult {
  valid: boolean
  severity?: SecuritySeverity
  message?: string
  rule?: string
  pattern?: string
  confidence?: number
}

// export type InternalValidationResult = ValidationResult & {
//   type?: SecurityThreatType
// }

export interface BodyValidator {
  validate(data: unknown): Promise<ValidationResult> | ValidationResult
}

export type BodyValidationResult =
  | {
      valid: true
      type?: never
      severity?: never
      message?: never
      rule?: never
      pattern?: never
      confidence?: never
    }
  | {
      valid: false
      type: SecurityThreatType
      severity?: SecuritySeverity
      message?: string
      rule?: string
      pattern?: string
      confidence?: number
    }

export interface InternalValidationResult {
  allowed: boolean
  response?: NextResponse
}

// Type-safe validation error details
export interface ValidationError {
  severity: SecuritySeverity
  message: string
  rule: string
  pattern?: string
  confidence: number
}

export interface RateLimitResult {
  allowed: boolean
  response?: NextResponse
}
