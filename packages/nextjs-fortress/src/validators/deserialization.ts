// validators/deserialization.ts - Prevents CVE-2025-55182 and prototype pollution attacks

import { ValidationResult, DeserializationConfig } from '../types'
import { DEFAULT_BLOCK_LIST , DEFAULT_DANGEROUS_PATTERNS } from '../constants'

/**
 * Deserialization validator class
 */
export class DeserializationValidator {
  private config: DeserializationConfig
  private blockList: Set<string>
  private dangerousPatterns: RegExp[]

  constructor(config: DeserializationConfig) {
    this.config = config
    this.blockList = new Set([
      ...DEFAULT_BLOCK_LIST,
      ...(config.blockList || []),
    ])

    // Convert string patterns to case-insensitive regex
    const patterns = [
      ...DEFAULT_DANGEROUS_PATTERNS,
      ...(config.dangerousPatterns || []),
    ]
    this.dangerousPatterns = patterns.map(
      (pattern) => new RegExp(pattern, 'gi')
    )
  }

  /**
   * Main validation entry point
   */
  public validate(payload: unknown): ValidationResult {
    if (!this.config.enabled) {
      return { valid: true }
    }

    try {
      if (this.config.detectCircular) {
        const circularCheck = this.checkCircularReferences(payload)
        if (!circularCheck.valid) {
          return circularCheck
        }
      }

      // Rule 1: Check for dangerous keys
      const keyCheck = this.checkDangerousKeys(payload)
      if (!keyCheck.valid) {
        return keyCheck
      }

      // Rule 2: Check for dangerous patterns in values
      const patternCheck = this.checkDangerousPatterns(payload)
      if (!patternCheck.valid) {
        return patternCheck
      }

      // Rule 3: Check nesting depth
      if (this.config.maxDepth > 0) {
        const depthCheck = this.checkDepth(payload, 0)
        if (!depthCheck.valid) {
          return depthCheck
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        severity: 'high',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rule: 'validation_error',
        confidence: 0.9,
      }
    }
  }

  /**
   * Check for dangerous keys that could lead to prototype pollution
   */
  private checkDangerousKeys(
    obj: unknown,
    path: string = ''
  ): ValidationResult {
    if (obj === null || typeof obj !== 'object') {
      return { valid: true }
    }

    const target = obj as Record<string, unknown>

    // 1. Get all keys, including non-enumerable ones
    const keys = Reflect.ownKeys(target)

    for (const key of keys) {
      if (typeof key !== 'string') continue

      const lowerKey = key.toLowerCase()

      if (this.blockList.has(lowerKey)) {
        return {
          valid: false,
          severity: 'critical',
          message: `Dangerous key detected: "${key}" at path "${path}"`,
          rule: 'dangerous_key',
          pattern: key,
          confidence: 1.0,
        }
      }

      const currentPath = path ? `${path}.${key}` : key

      try {
        // 2. Fix: Use target[key] instead of obj[key]
        const result = this.checkDangerousKeys(target[key], currentPath)
        if (!result.valid) return result
      } catch {
        continue
      }
    }

    // 3. THE MISSING PIECE: Explicit Prototype Check
    // We check if the object's prototype has been swapped to something suspicious.
    const proto = Object.getPrototypeOf(obj)
    if (proto && proto !== Object.prototype && proto !== Array.prototype) {
      // If the object has a custom prototype, we must treat that as a violation
      // in a security-first deserializer, as standard JSON doesn't support prototypes.
      return {
        valid: false,
        severity: 'critical',
        message: `Custom prototype detected at path "${path}"`,
        rule: 'custom_prototype_detected',
        confidence: 1.0,
      }
    }

    return { valid: true }
  }

  /**
   * Check for dangerous patterns in stringified values
   */
  private checkDangerousPatterns(obj: unknown): ValidationResult {
    try {
      // Stringify the entire object to search for patterns
      const stringified = JSON.stringify(obj).toLowerCase()

      for (const pattern of this.dangerousPatterns) {
        pattern.lastIndex = 0 // Reset regex state
        const match = pattern.exec(stringified)

        if (match) {
          return {
            valid: false,
            severity: 'high',
            message: `Dangerous pattern detected: "${match[0]}"`,
            rule: 'dangerous_pattern',
            pattern: match[0],
            confidence: 0.95,
          }
        }
      }

      return { valid: true }
    } catch {
      // If stringification fails, treat as suspicious
      return {
        valid: false,
        severity: 'medium',
        message: 'Could not stringify payload for pattern detection',
        rule: 'stringification_failed',
        confidence: 0.7,
      }
    }
  }

  /**
   * Check nesting depth to prevent deeply nested attacks
   */
  private checkDepth(obj: unknown, currentDepth: number): ValidationResult {
    if (currentDepth > this.config.maxDepth) {
      return {
        valid: false,
        severity: 'medium',
        message: `Nesting depth exceeds maximum (${this.config.maxDepth})`,
        rule: 'max_depth_exceeded',
        confidence: 0.85,
      }
    }

    if (obj === null || typeof obj !== 'object') {
      return { valid: true }
    }

    // Check all nested values
    for (const value of Object.values(obj)) {
      if (value !== null && typeof value === 'object') {
        const result = this.checkDepth(value, currentDepth + 1)
        if (!result.valid) {
          return result
        }
      }
    }

    return { valid: true }
  }

  /**
   * Check for circular references
   */
  private checkCircularReferences(
    obj: unknown,
    seen = new WeakSet()
  ): ValidationResult {
    if (obj === null || typeof obj !== 'object') {
      return { valid: true }
    }

    if (seen.has(obj)) {
      return {
        valid: false,
        severity: 'high',
        message: 'Circular reference detected in payload',
        rule: 'circular_reference',
        confidence: 1.0,
      }
    }

    seen.add(obj)

    // Check all nested values
    for (const value of Object.values(obj)) {
      if (value !== null && typeof value === 'object') {
        const result = this.checkCircularReferences(value, seen)
        if (!result.valid) {
          return result
        }
      }
    }

    return { valid: true }
  }

  /**
   * Quick pre-check for obvious exploits (fast path)
   */
  public quickCheck(payload: unknown): boolean {
    if (!this.config.enabled) {
      return true
    }

    try {
      const str = JSON.stringify(payload).toLowerCase()

      // Fast check for most common exploit patterns
      const quickPatterns = ['__proto__', 'constructor', 'prototype']
      return !quickPatterns.some((pattern) => str.includes(pattern))
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating validator instance
 */
export function createDeserializationValidator(
  config: DeserializationConfig
): DeserializationValidator {
  return new DeserializationValidator(config)
}
