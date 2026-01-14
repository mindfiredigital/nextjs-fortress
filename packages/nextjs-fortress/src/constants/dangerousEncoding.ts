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