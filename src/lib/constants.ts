/* Routes */
export const AUTH_ROOT = '/login'
export const APP_ROOT = '/dashboard'

/* Params */
export const COURSE_STEP_PARAM = 'lesson'
export const COURSE_LANGUAGE_PARAM = 'lang'

/* Validation */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
export const SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/
export const CAMEL_CASE_REGEX = /[\s_.\\/-]+/
