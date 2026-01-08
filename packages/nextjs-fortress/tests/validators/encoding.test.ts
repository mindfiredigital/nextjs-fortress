// tests/validators/encoding.test.ts

import { describe, test, expect, beforeEach } from '@jest/globals'
import { createEncodingValidator } from '../../src'

describe('EncodingValidator', () => {
  let validator: any

  beforeEach(() => {
    validator = createEncodingValidator({
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    })
  })

  describe('Content-Type Validation', () => {
    test('should block UTF-16LE in content-type', async () => {
      const contentType = 'application/json; charset=utf-16le'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(false)
      expect(result.severity).toBe('critical')
      expect(result.message).toContain('utf-16le')
    })

    test('should block UTF-32 in content-type', async () => {
      const contentType = 'text/html; charset=utf-32'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(false)
    })

    test('should allow UTF-8', async () => {
      const contentType = 'application/json; charset=utf-8'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(true)
    })

    test('should allow plain content-type without charset', async () => {
      const contentType = 'application/json'
      const result = await validator.validate(contentType, null)

      expect(result.valid).toBe(true)
    })
  })

  describe('BOM Detection', () => {
    test('should detect UTF-16LE BOM', async () => {
      const buffer = new Uint8Array([0xff, 0xfe, 0x48, 0x00])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf16le')
    })

    test('should detect UTF-16BE BOM', async () => {
      const buffer = new Uint8Array([0xfe, 0xff, 0x00, 0x48])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf16be')
    })

    test('should detect UTF-32LE BOM', async () => {
      const buffer = new Uint8Array([0xff, 0xfe, 0x00, 0x00])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(false)
      expect(result.rule).toBe('bom_utf32le')
    })

    test('should allow UTF-8 BOM', async () => {
      const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x48])
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(true)
    })

    test('should allow regular UTF-8 content', async () => {
      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"
      const result = await validator.validate(null, buffer.buffer)

      expect(result.valid).toBe(true)
    })
  })

  describe('Quick Check', () => {
    test('should quickly detect dangerous encodings', () => {
      const result = validator.quickCheck('application/json; charset=utf-16le')
      expect(result).toBe(false)
    })

    test('should pass safe encodings', () => {
      const result = validator.quickCheck('application/json; charset=utf-8')
      expect(result).toBe(true)
    })

    test('should pass content-type without charset', () => {
      const result = validator.quickCheck('application/json')
      expect(result).toBe(true)
    })

    test('should detect UTF-32', () => {
      const result = validator.quickCheck('text/html; charset=utf-32')
      expect(result).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    test('should handle null content-type', async () => {
      const result = await validator.validate(null, null)
      expect(result.valid).toBe(true)
    })

    test('should handle empty buffer', async () => {
      const buffer = new Uint8Array([])
      const result = await validator.validate(null, buffer.buffer)
      expect(result.valid).toBe(true)
    })

    test('should handle buffer smaller than BOM', async () => {
      const buffer = new Uint8Array([0xff])
      const result = await validator.validate(null, buffer.buffer)
      expect(result.valid).toBe(true)
    })
  })
})
