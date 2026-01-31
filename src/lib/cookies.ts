import { type Locale } from 'next-intl'

import { type Theme } from '@/components/providers/theme-provider'
import { i18n } from '@/lib/i18n'

export const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? ''

export const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const

export interface Cookies {
  [i18n.cookie]: Locale
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

export const unprefixCookieName = (name: string, prefix: string | false = COOKIE_PREFIX) =>
  prefix === false ? name : name.replace(prefix, '')
