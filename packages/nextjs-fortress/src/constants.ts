export const DEFAULT_BLOCK_LIST = [
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'toString',
  'valueOf',
  'hasOwnProperty',
]

/**
 * Dangerous patterns found in exploit payloads
 */
export const DEFAULT_DANGEROUS_PATTERNS = [
  'resolved_model', // React Flight internal state
  '_response', // RSC internal
  '_prefix', // Malware dropper marker
  '_formdata', // Form data hijacking
  'child_process', // Command execution
  'require', // Module loading
  'eval', // Code evaluation
  'function', // Function constructor
  'import\\(', // Dynamic imports (escaped parenthesis)
  '__dirname', // Node.js path access
  '__filename', // Node.js path access
  'process\\.env', // Environment variables (escaped dot)
  'fs\\.readfile', // File system access (escaped dot)
  'fs\\.writefile', // File system access (escaped dot)
  'execsync', // Command execution
  'spawn', // Process spawning
]

/**
 * Dangerous encodings that can bypass WAF
 */
export const DANGEROUS_ENCODINGS = [
  'utf-16',
  'utf-16le',
  'utf-16be',
  'utf-32',
  'utf-32le',
  'utf-32be',
  'ucs-2',
  'iso-2022-jp',
  'gb18030',
] as const

/**
 * SQL Injection patterns
 */
export const SQL_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi,
  /(\bDELETE\b.*\bFROM\b)/gi,
  /(\bDROP\b.*\bTABLE\b)/gi,
  /(\bUPDATE\b.*\bSET\b)/gi,
  /(\bEXEC(UTE)?\b)/gi,
  /(\bSELECT\b.*\bFROM\b)/gi,
  /(;\s*--)/g,
  /('|" \s*OR\s*'1'\s*=\s*'1)/gi,
  /(\bOR\b.*=.*)/gi,
  /(\bAND\b.*=.*)/gi,
]

/**
 * Command Injection patterns
 */
export const COMMAND_PATTERNS = [
  /[;&|`$(){}[\]<>]/, // Fix: removed escape from [
  /(bash|sh|cmd|powershell|exec|spawn)/gi,
  /(\|\s*cat\s+)/gi,
  /(>\s*\/dev\/null)/gi,
  /(\$\(.*\))/g, // Command substitution
  /(wget|curl).*http/gi, // Remote code fetching
  /(nc|netcat).*-e/gi, // Reverse shells
]

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

export const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'UPDATE',
  'DELETE',
  'UNION',
  'JOIN',
  'DROP',
  'CREATE',
  'ALTER',
  'TABLE',
  'DATABASE',
  'EXEC',
  'EXECUTE',
  'AND',
  'OR',
]

// Fast check for most dangerous patterns
export const QUICK_PATTERNS = [
  '__proto__',
  '<script',
  'javascript:',
  'union select',
  '|cat',
  '$()',
]
