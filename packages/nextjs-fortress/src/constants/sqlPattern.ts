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
