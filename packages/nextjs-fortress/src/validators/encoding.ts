// validators/encoding.ts - Full encoding validation (Ghost Mode protection)

import { ValidationResult, EncodingConfig } from '../types'
import { DANGEROUS_ENCODINGS } from '../constants'

/**
 * Encoding validator class
 */
export class EncodingValidator {
  private config: EncodingConfig
  private allowedEncodings: Set<string>

  constructor(config: EncodingConfig) {
    this.config = config

    // Default to UTF-8 only if blockNonUTF8 is true
    this.allowedEncodings = new Set(
      config.allowedEncodings || (config.blockNonUTF8 ? ['utf-8', 'utf8'] : [])
    )
  }

  /**
   * Main validation entry point
   */
  public async validate(
    contentType: string | null,
    body: ArrayBuffer | null
  ): Promise<ValidationResult> {
    if (!this.config.enabled) {
      return { valid: true }
    }

    // 1. Check Content-Type header for encoding
    if (contentType) {
      const headerResult = this.validateContentTypeHeader(contentType)
      if (!headerResult.valid) {
        return headerResult
      }
    }

    // 2. Check BOM if body is provided
    if (this.config.detectBOM && body) {
      const bomResult = this.detectBOM(body)
      if (!bomResult.valid) {
        return bomResult
      }
    }

    return { valid: true }
  }

  /**
   * Validate Content-Type header for dangerous encodings
   */
  private validateContentTypeHeader(contentType: string): ValidationResult {
    const lowerContentType = contentType.toLowerCase()

    // Extract charset if present
    const charsetMatch = lowerContentType.match(/charset=([^;,\s]+)/)
    if (charsetMatch) {
      const charset = charsetMatch[1].toLowerCase()

      // Check against dangerous encodings
      for (const dangerous of DANGEROUS_ENCODINGS) {
        if (charset.includes(dangerous)) {
          return {
            valid: false,
            severity: 'critical',
            message: `Dangerous encoding detected in Content-Type: ${charset}`,
            rule: 'dangerous_encoding',
            pattern: charset,
            confidence: 1.0,
          }
        }
      }

      // If allowedEncodings is set, check against whitelist
      if (this.allowedEncodings.size > 0) {
        const isAllowed = Array.from(this.allowedEncodings).some((allowed) =>
          charset.includes(allowed)
        )

        if (!isAllowed) {
          return {
            valid: false,
            severity: 'high',
            message: `Non-whitelisted encoding: ${charset}`,
            rule: 'encoding_not_allowed',
            pattern: charset,
            confidence: 0.9,
          }
        }
      }
    }

    // Check for encoding in Content-Type directly (not in charset)
    for (const dangerous of DANGEROUS_ENCODINGS) {
      if (lowerContentType.includes(dangerous)) {
        return {
          valid: false,
          severity: 'critical',
          message: `Dangerous encoding in Content-Type: ${dangerous}`,
          rule: 'dangerous_encoding_content_type',
          pattern: dangerous,
          confidence: 1.0,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Detect BOM (Byte Order Mark) in request body
   */
  private detectBOM(body: ArrayBuffer): ValidationResult {
    const bytes = new Uint8Array(body)

    // Need at least 2 bytes to check BOM
    if (bytes.length < 2) {
      return { valid: true }
    }

    // Check for UTF-16LE BOM (Ghost Mode vulnerability)
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      // Could be UTF-16LE or UTF-32LE, check further
      if (bytes.length >= 4 && bytes[2] === 0x00 && bytes[3] === 0x00) {
        return {
          valid: false,
          severity: 'critical',
          message: 'UTF-32LE BOM detected (WAF bypass attempt)',
          rule: 'bom_utf32le',
          pattern: 'FF FE 00 00',
          confidence: 1.0,
        }
      }

      return {
        valid: false,
        severity: 'critical',
        message: 'UTF-16LE BOM detected (Ghost Mode WAF bypass)',
        rule: 'bom_utf16le',
        pattern: 'FF FE',
        confidence: 1.0,
      }
    }

    // Check for UTF-16BE BOM
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return {
        valid: false,
        severity: 'critical',
        message: 'UTF-16BE BOM detected (WAF bypass attempt)',
        rule: 'bom_utf16be',
        pattern: 'FE FF',
        confidence: 1.0,
      }
    }

    // Check for UTF-32BE BOM
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x00 &&
      bytes[1] === 0x00 &&
      bytes[2] === 0xfe &&
      bytes[3] === 0xff
    ) {
      return {
        valid: false,
        severity: 'critical',
        message: 'UTF-32BE BOM detected (WAF bypass attempt)',
        rule: 'bom_utf32be',
        pattern: '00 00 FE FF',
        confidence: 1.0,
      }
    }

    // Check for UTF-8 BOM (allowed but warn in dev mode)
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      // UTF-8 BOM is allowed but unnecessary
      return { valid: true }
    }

    // Check for GB18030 BOM (Chinese encoding that can bypass WAF)
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x84 &&
      bytes[1] === 0x31 &&
      bytes[2] === 0x95 &&
      bytes[3] === 0x33
    ) {
      return {
        valid: false,
        severity: 'high',
        message: 'GB18030 BOM detected (potential WAF bypass)',
        rule: 'bom_gb18030',
        pattern: '84 31 95 33',
        confidence: 0.95,
      }
    }

    return { valid: true }
  }

  /**
   * Convert non-UTF8 body to UTF-8 (normalization)
   */
  public normalizeToUTF8(body: ArrayBuffer): string {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true })
      return decoder.decode(body)
    } catch {
      throw new Error('Failed to decode body as UTF-8')
    }
  }

  /**
   * Quick check for obvious encoding issues
   */
  public quickCheck(contentType: string | null): boolean {
    if (!this.config.enabled || !contentType) {
      return true
    }

    const lower = contentType.toLowerCase()
    return !DANGEROUS_ENCODINGS.some((enc) => lower.includes(enc))
  }
}

/**
 * Factory function
 */
export function createEncodingValidator(
  config: EncodingConfig
): EncodingValidator {
  return new EncodingValidator(config)
}
