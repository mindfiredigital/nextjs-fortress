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