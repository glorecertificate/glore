/* Routes */
export const AUTH_ROOT = '/login'
export const APP_ROOT = '/dashboard'

/* Params */
export const COURSE_LIST_PARAMS = {
  LANGUAGES: 'lang',
  SKILL_GROUPS: 'groups',
  SORT_DIRECTION: 'dir',
  SORT: 'sort',
  TAB: 'tab',
} as const
export const COURSE_PARAMS = {
  STEP: 'lesson',
  LANGUAGE: 'lang',
} as const

/* Validation */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
export const SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/
export const CAMEL_CASE_REGEX = /[\s_.\\/-]+/
