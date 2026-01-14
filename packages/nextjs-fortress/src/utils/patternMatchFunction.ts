/**
 * Helper function to match path patterns with wildcards
 */
export function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // /api/admin/* becomes /^\/api\/admin\/.*$/
  const regexPattern = pattern
    .replace(/\*/g, '.*') // * becomes .*
    .replace(/\//g, '\\/') // escape slashes
    .replace(/\?/g, '.') // ? becomes single char

  return new RegExp(`^${regexPattern}$`).test(path)
}

/**
 * Utility function to check if a path matches any pattern
 * Useful for custom middleware logic
 *
 * @example
 * ```typescript
 * if (pathMatches('/api/admin/users', ['/api/admin/*'])) {
 *   // do something
 * }
 * ```
 */
export function pathMatches(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern))
}
