// validators/csrf.ts - CSRF Protection Implementation (Edge Runtime Compatible)

import { ValidationResult, CSRFConfig, CSRFToken } from '../types'

/**
 * Token storage (in-memory for now)
 */
const tokenStore = new Map<string, CSRFToken>()

/**
 * Web Crypto API helpers (Edge Runtime compatible)
 */
async function generateRandomBytes(length: number): Promise<Uint8Array> {
  const buffer = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      buffer[i] = Math.floor(Math.random() * 256)
    }
  }
  return buffer
}

function arrayBufferToHex(buffer: ArrayBufferLike): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function createHMAC(data: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API (Edge Runtime compatible)
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const dataBuffer = encoder.encode(data)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, dataBuffer)
    return arrayBufferToHex(signature).substring(0, 16)
  } else {
    // Fallback to simple hash for environments without crypto.subtle
    return simpleHash(data + secret).substring(0, 16)
  }
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

/**
 * CSRF Validator class
 */
export class CSRFValidator {
  private config: CSRFConfig
  private secret: string

  constructor(config: CSRFConfig) {
    this.config = config
    this.secret = config.tokenSecret || this.generateSecret()
  }

  /**
   * Generate a new CSRF token for a session
   */
  public async generateToken(sessionId: string): Promise<string> {
    const tokenLength = this.config.tokenLength || 32
    const expiryMs = this.config.expiryMs || 24 * 60 * 60 * 1000

    // Generate random token
    const randomBuffer = await generateRandomBytes(tokenLength)
    const randomToken = arrayBufferToHex(randomBuffer.buffer)

    // Create signature
    const signature = await this.createSignature(randomToken, sessionId)
    const token = `${randomToken}.${signature}`

    // Store token with expiry
    tokenStore.set(sessionId, {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryMs,
    })

    return token
  }

  /**
   * Validate CSRF token from request
   */
  public async validate(
    token: string | null | undefined,
    sessionId: string,
    method: string
  ): Promise<ValidationResult> {
    if (!this.config.enabled) {
      return { valid: true }
    }

    // Safe methods don't require CSRF protection
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(method.toUpperCase())) {
      return { valid: true }
    }

    // No token provided
    if (!token) {
      return {
        valid: false,
        severity: 'high',
        message: 'CSRF token missing',
        rule: 'csrf_token_missing',
        confidence: 1.0,
      }
    }

    // Get stored token
    const storedToken = tokenStore.get(sessionId)
    if (!storedToken) {
      return {
        valid: false,
        severity: 'high',
        message: 'No CSRF token found for session',
        rule: 'csrf_no_session_token',
        confidence: 1.0,
      }
    }

    // Check expiry
    if (Date.now() > storedToken.expiresAt) {
      tokenStore.delete(sessionId)
      return {
        valid: false,
        severity: 'medium',
        message: 'CSRF token expired',
        rule: 'csrf_token_expired',
        confidence: 1.0,
      }
    }

    // Validate token matches
    if (token !== storedToken.token) {
      return {
        valid: false,
        severity: 'critical',
        message: 'Invalid CSRF token',
        rule: 'csrf_token_invalid',
        confidence: 1.0,
      }
    }

    // Verify signature
    const [randomPart, signature] = token.split('.')
    const expectedSignature = await this.createSignature(randomPart, sessionId)

    if (signature !== expectedSignature) {
      return {
        valid: false,
        severity: 'critical',
        message: 'CSRF token signature mismatch',
        rule: 'csrf_signature_invalid',
        confidence: 1.0,
      }
    }

    return { valid: true }
  }

  /**
   * Create HMAC signature for token
   */
  private async createSignature(
    token: string,
    sessionId: string
  ): Promise<string> {
    return await createHMAC(`${token}:${sessionId}`, this.secret)
  }

  /**
   * Generate secret if not provided
   */
  private generateSecret(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  /**
   * Clean up expired tokens (call periodically)
   */
  public cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, token] of tokenStore.entries()) {
      if (now > token.expiresAt) {
        tokenStore.delete(sessionId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Get token from cookie name
   */
  public getCookieName(): string {
    return this.config.cookieName
  }

  /**
   * Get token from header name
   */
  public getHeaderName(): string {
    return this.config.headerName || 'X-CSRF-Token'
  }
}

/**
 * Factory function
 */
export function createCSRFValidator(config: CSRFConfig): CSRFValidator {
  return new CSRFValidator(config)
}
