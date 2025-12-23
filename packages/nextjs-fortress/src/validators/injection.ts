// validators/injection.ts - Detects SQL, command, XSS, and code injection attacks

import { ValidationResult, InjectionConfig } from '../types'
import {SQL_PATTERNS,COMMAND_PATTERNS,XSS_PATTERNS,CODE_INJECTION_PATTERNS,SQL_KEYWORDS,QUICK_PATTERNS} from "../constants"

/**
 * Injection validator class
 */
export class InjectionValidator {
  private config: InjectionConfig
  private patterns: Map<string, RegExp[]>

  constructor(config: InjectionConfig) {
    this.config = config
    this.patterns = new Map()

    // Initialize pattern sets based on enabled checks
    if (config.checks.includes('sql')) {
      this.patterns.set('sql', SQL_PATTERNS)
    }
    if (config.checks.includes('command')) {
      this.patterns.set('command', COMMAND_PATTERNS)
    }
    if (config.checks.includes('xss')) {
      this.patterns.set('xss', XSS_PATTERNS)
    }
    if (config.checks.includes('codeInjection')) {
      this.patterns.set('codeInjection', CODE_INJECTION_PATTERNS)
    }

    // Add custom patterns if provided
    if (config.customPatterns && config.customPatterns.length > 0) {
      this.patterns.set('custom', config.customPatterns)
    }
  }

  /**
   * Main validation entry point
   */
  public validate(input: unknown): ValidationResult {
    if (!this.config.enabled) {
      return { valid: true }
    }

    // Convert input to searchable strings
    const searchableStrings = this.extractStrings(input)

    // Check each string against all pattern sets
    for (const str of searchableStrings) {
      for (const [type, patterns] of this.patterns) {
        const result = this.checkPatterns(str, patterns, type)
        if (!result.valid) {
          return result
        }
      }

      // Additional checks for SQL keyword density
      if (this.config.checks.includes('sql')) {
        const densityCheck = this.checkSQLKeywordDensity(str)
        if (!densityCheck.valid) {
          return densityCheck
        }
      }
    }

    return { valid: true }
  }

  /**
   * Extract all strings from input (including nested objects)
   */
  private extractStrings(input: unknown, depth: number = 0): string[] {
    const strings: string[] = []
    const maxDepth = 10

    if (depth > maxDepth) {
      return strings
    }

    if (typeof input === 'string') {
      strings.push(input)
    } else if (Array.isArray(input)) {
      for (const item of input) {
        strings.push(...this.extractStrings(item, depth + 1))
      }
    } else if (input !== null && typeof input === 'object') {
      for (const value of Object.values(input)) {
        strings.push(...this.extractStrings(value, depth + 1))
      }
    }

    return strings
  }

  /**
   * Check a string against a set of patterns
   */
  private checkPatterns(
    str: string,
    patterns: RegExp[],
    type: string
  ): ValidationResult {
    for (const pattern of patterns) {
      pattern.lastIndex = 0 // Reset regex state
      const match = pattern.exec(str)

      if (match) {
        return {
          valid: false,
          severity: this.getSeverity(type),
          message: `${this.getTypeName(type)} injection detected: "${match[0]}"`,
          rule: `${type}_injection`,
          pattern: match[0],
          confidence: 0.9,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Check SQL keyword density (high density = likely injection)
   */
  private checkSQLKeywordDensity(str: string): ValidationResult {
    const words = str.toUpperCase().split(/\s+/)
    const keywordCount = words.filter((word) =>
      SQL_KEYWORDS.includes(word)
    ).length
    const density = words.length > 0 ? keywordCount / words.length : 0

    // If more than 30% of words are SQL keywords, flag as suspicious
    if (density > 0.3 && keywordCount >= 3) {
      return {
        valid: false,
        severity: 'high',
        message: `High SQL keyword density detected (${(density * 100).toFixed(0)}%)`,
        rule: 'sql_keyword_density',
        confidence: Math.min(density * 2, 1),
      }
    }

    return { valid: true }
  }

  /**
   * Get severity level for injection type
   */
  private getSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'sql':
      case 'command':
      case 'codeInjection':
        return 'critical'
      case 'xss':
        return 'high'
      default:
        return 'medium'
    }
  }

  /**
   * Get human-readable type name
   */
  private getTypeName(type: string): string {
    const names: Record<string, string> = {
      sql: 'SQL',
      command: 'Command',
      xss: 'XSS',
      codeInjection: 'Code',
      custom: 'Custom',
    }
    return names[type] || 'Unknown'
  }

  /**
   * Quick pre-check for obvious injection attempts
   */
  public quickCheck(input: unknown): boolean {
    if (!this.config.enabled) {
      return true
    }

    const str = JSON.stringify(input).toLowerCase()

    return !QUICK_PATTERNS.some((pattern) => str.includes(pattern))
  }
}

/**
 * Factory function for creating validator instance
 */
export function createInjectionValidator(
  config: InjectionConfig
): InjectionValidator {
  return new InjectionValidator(config)
}
