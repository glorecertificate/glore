/* Routes */
export const AUTH_ROOT = '/login'
export const APP_ROOT = '/dashboard'
export const JOIN_ROOT = '/api/v1/join'
export const ONBOARDING_ROOT = '/onboarding'

/* App */
export const AUTH_VIEWS = [
  'login',
  'password_request',
  'email_sent',
  'password_reset',
  'password_updated',
  'invalid_token',
  'invalid_password_reset',
] as const

/* Validation */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
export const SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/
export const CAMEL_CASE_REGEX = /[\s_.\\/-]+/
