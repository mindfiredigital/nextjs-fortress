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