/**
 * Application-wide constants
 */

export const APP_INFO = {
  NAME: 'nextjs-fortress',
  VERSION: '1.0.0',
  DESCRIPTION: 'Test and validate security protections against common attack vectors',
  AUTHOR: 'Mindfire Digital',
  GITHUB: 'https://github.com/lakinmindfire/nextjs-fortress',
}

export const UI_CONFIG = {
  MAX_HISTORY_ITEMS: 10,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
}

export const API_ENDPOINTS = {
  TEST: '/api/test',
}

export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  DANGER: '#ef4444',
  WARNING: '#f59e0b',
}

export const SECURITY_HEADERS = {
  'X-Fortress-Protected': 'true',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}