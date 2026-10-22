/* Routes */
export const AUTH_ROOT = '/login'
export const APP_ROOT = '/dashboard'
export const JOIN_ROOT = '/api/v1/join'
export const SESSION_ROOT = '/api/v1/session'
export const ONBOARDING_ROOT = '/onboarding'
export const ONBOARDING_ERROR_ROOT = '/onboarding/error'
export const ACCEPT_INVITATION_ROOT = '/api/auth/accept-invitation'
export const REGISTER_ROOT = '/register'
export const INVITE_ROOT = '/invite'
export const JOIN_LINK_ROOT = '/join'
export const SETTINGS_ROOT = '/settings'
export const VERIFY_ROOT = '/verify'
export const LEGAL_ROOTS = ['/privacy', '/quality-charter', '/terms'] as const
export const DASHBOARD_ROOTS = [
  '/about',
  '/admin',
  '/certificates',
  '/courses',
  '/dashboard',
  '/docs',
  '/emails',
  '/help',
  '/notifications',
  '/organization',
  '/register',
  '/settings',
]

/* App */
export const SKILL_LEVELS = ['absent', 'basic', 'intermediate', 'good', 'advanced'] as const
export const AUTH_VIEWS = [
  'login',
  'password_request',
  'email_sent',
  'password_reset',
  'password_updated',
  'invalid_token',
  'invalid_password_reset',
] as const

/* Invitations */
export const INVITATION_EXPIRY_DAYS = 7

/* Auth */
export const AUTH_LINK_EXPIRY_SECONDS = 60 * 60

/* Storage */
export const AVATAR_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const SIGNATURE_CONTENT_TYPES = ['image/png', 'image/jpeg']

/* Validation */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/u
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/u
export const SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/u
export const CAMEL_CASE_REGEX = /[\s_.\\/-]+/u
