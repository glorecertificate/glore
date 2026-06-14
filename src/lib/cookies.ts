import { type Locale } from 'next-intl'

import { LOCALE_COOKIE } from '@/lib/i18n'
import { type Theme } from '@/lib/types'

export const COOKIE_PREFIX = 'gl_'

export const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const

interface Cookies {
  [LOCALE_COOKIE]: Locale
  courseListLanguages: Record<number, Locale>
  courseListParams: string
  email: string
  loginUser: string
  org: number
  sidebarOpen: boolean
  sidebarWidth: string
  theme: Theme
}

export type CookieName = keyof Cookies
export type CookieValue<T> = T extends CookieName ? Cookies[T] | undefined : undefined
export type CookieOptions<T = {}> = T & {
  prefix?: string | false
}

export const prefixCookieName = (name: CookieName, prefix: string | false = COOKIE_PREFIX) =>
  prefix === false ? name : `${prefix}${name}`
