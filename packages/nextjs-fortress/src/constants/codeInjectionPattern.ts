/**
 * Code Injection patterns
 */
export const CODE_INJECTION_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(\s*["']/gi, // String-based setTimeout
  /setInterval\s*\(\s*["']/gi, // String-based setInterval
  /\.constructor\s*\(/gi,
  /import\s*\(/gi, // Dynamic imports
  /require\s*\(/gi, // CommonJS require
]