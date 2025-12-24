import { NextRequest, NextResponse } from 'next/server'
import {
  FortressConfig,
  ValidationResult as BaseValidationResult,
  SecurityThreatType,
  InternalValidationResult,
  ValidationError,
} from '../types'
import { FortressLogger } from '../utils/logger'
import { createDeserializationValidator } from '../validators/deserialization'
import { createInjectionValidator } from '../validators/injection'
import { createEncodingValidator } from '../validators/encoding'
import { createCSRFValidator } from '../validators/csrf'
import { createSecurityEvent } from '../utils/securityEvent'

/**
 * Request validator - handles all validation logic
 */
export class RequestValidator {
  private config: FortressConfig
  private logger: FortressLogger
  private deserializationValidator
  private injectionValidator
  private encodingValidator
  private csrfValidator

  constructor(config: FortressConfig, logger: FortressLogger) {
    this.config = config
    this.logger = logger

    this.deserializationValidator = createDeserializationValidator(
      config.modules.deserialization
    )
    this.injectionValidator = createInjectionValidator(config.modules.injection)
    this.encodingValidator = createEncodingValidator(config.modules.encoding)
    this.csrfValidator = config.modules.csrf.enabled
      ? createCSRFValidator(config.modules.csrf)
      : null
  }

  async validate(request: NextRequest): Promise<InternalValidationResult> {
    // 1. CSRF validation
    if (this.csrfValidator && this.requiresCSRFValidation(request.method)) {
      const csrfResult = await this.validateCSRF(request)
      if (!csrfResult.allowed) return csrfResult
    }

    // 2. Content size validation
    if (this.config.modules.content.enabled) {
      const contentResult = this.validateContentSize(request)
      if (!contentResult.allowed) return contentResult
    }

    // 3. Encoding validation
    if (this.config.modules.encoding.enabled) {
      const encodingResult = await this.validateEncoding(request)
      if (!encodingResult.allowed) return encodingResult
    }

    // 4. Body validation (deserialization + injection)
    if (this.requiresBodyValidation(request.method)) {
      const bodyResult = await this.validateBody(request)
      if (!bodyResult.allowed) return bodyResult
    }

    return { allowed: true }
  }

  private requiresCSRFValidation(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  }

  private requiresBodyValidation(method: string): boolean {
    return ['POST', 'PUT', 'PATCH'].includes(method)
  }

  private async validateCSRF(
    request: NextRequest
  ): Promise<InternalValidationResult> {
    if (!this.csrfValidator) return { allowed: true }

    const token =
      request.headers.get('x-csrf-token') ||
      request.cookies.get('csrf-token')?.value
    const sessionId = request.cookies.get('session-id')?.value || 'anonymous'

    const result = await this.csrfValidator.validate(
      token,
      sessionId,
      request.method
    )

    if (!result.valid) {
      const errorDetails: ValidationError = {
        severity: result.severity || 'high',
        message: result.message || 'CSRF validation failed',
        rule: result.rule || 'csrf_protection',
        pattern: result.pattern,
        confidence: result.confidence || 1.0,
      }

      return this.createBlockedResponse(request, errorDetails, 'csrf')
    }

    return { allowed: true }
  }

  private validateContentSize(request: NextRequest): InternalValidationResult {
    const contentLength = request.headers.get('content-length')
    if (!contentLength) return { allowed: true }

    const size = parseInt(contentLength, 10)
    if (size > this.config.modules.content.maxPayloadSize) {
      return {
        allowed: false,
        response: new NextResponse('Payload Too Large', { status: 413 }),
      }
    }

    return { allowed: true }
  }

  private async validateEncoding(
    request: NextRequest
  ): Promise<InternalValidationResult> {
    const contentType = request.headers.get('content-type')
    const bodyBuffer = await request.clone().arrayBuffer()

    const result = await this.encodingValidator.validate(
      contentType,
      bodyBuffer
    )

    if (!result.valid) {
      const errorDetails: ValidationError = {
        severity: result.severity || 'critical',
        message: result.message || 'Invalid encoding detected',
        rule: result.rule || 'encoding_validation',
        pattern: result.pattern,
        confidence: result.confidence || 1.0,
      }

      return this.createBlockedResponse(request, errorDetails, 'encoding')
    }

    return { allowed: true }
  }

  private async validateBody(
    request: NextRequest
  ): Promise<InternalValidationResult> {
    try {
      const clonedRequest = request.clone()
      const body = await clonedRequest.text()
      if (!body) return { allowed: true }

      let parsedBody: unknown
      try {
        parsedBody = JSON.parse(body)
      } catch {
        // Not JSON - validate as text
        const result = this.injectionValidator.validate(body)
        if (!result.valid) {
          return this.createValidationFailureResponse(
            request,
            result,
            'injection'
          )
        }
        return { allowed: true }
      }

      // Validate deserialization
      if (this.config.modules.deserialization.enabled) {
        const result = this.deserializationValidator.validate(parsedBody)
        if (!result.valid) {
          return this.createValidationFailureResponse(
            request,
            result,
            'deserialization'
          )
        }
      }

      // Validate injection
      if (this.config.modules.injection.enabled) {
        const result = this.injectionValidator.validate(parsedBody)
        if (!result.valid) {
          return this.createValidationFailureResponse(
            request,
            result,
            'injection'
          )
        }
      }

      return { allowed: true }
    } catch (error) {
      this.logger.error('Body validation error:', error)
      return {
        allowed: false,
        response: new NextResponse('Bad Request', { status: 400 }),
      }
    }
  }

  private async createValidationFailureResponse(
    request: NextRequest,
    validationResult: BaseValidationResult,
    type: SecurityThreatType
  ): Promise<InternalValidationResult> {
    const errorDetails: ValidationError = {
      severity: validationResult.severity || 'high',
      message: validationResult.message || 'Validation failed',
      rule: validationResult.rule || 'body_validation',
      pattern: validationResult.pattern,
      confidence: validationResult.confidence || 0.9,
    }

    return this.createBlockedResponse(request, errorDetails, type)
  }

  private async createBlockedResponse(
    request: NextRequest,
    error: ValidationError,
    threatType: SecurityThreatType
  ): Promise<InternalValidationResult> {
    const event = createSecurityEvent({
      type: threatType,
      severity: error.severity,
      message: error.message,
      request,
      rule: error.rule,
      pattern: error.pattern,
      confidence: error.confidence,
    })

    await this.config.onSecurityEvent?.(event)
    this.logger.logSecurityEvent(event)

    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({
          error: error.message,
          rule: error.rule,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'x-fortress-rule': error.rule,
            'x-fortress-confidence': error.confidence.toString(),
          },
        }
      ),
    }
  }
}
