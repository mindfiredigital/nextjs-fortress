/**
 * XSS (Cross-Site Scripting) patterns
 */
export const XSS_PATTERNS = [
  /<script[^>]*>.*<\/script>/gi,
  /on\w+\s*=\s*["']?[^"']*["']?/gi, // Event handlers
  /javascript:/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<img[^>]*onerror/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi, // CSS expression
  /vbscript:/gi,
  /data:text\/html/gi,
]