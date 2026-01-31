/* Routes */
export const AUTH_ROOT = '/login'
export const APP_ROOT = '/dashboard'
export const JOIN_ROOT = '/api/v1/join'
export const ONBOARDING_ROOT = '/onboarding'

/* Validation */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
export const SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/
export const CAMEL_CASE_REGEX = /[\s_.\\/-]+/
export const WHITESPACES_REGEX = /\s+/
export const SUPABASE_TOKEN_HASH_REGEX = /^pkce_[a-f0-9]*$/
