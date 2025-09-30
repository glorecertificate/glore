import type theme from '@config/theme'
import { type Locale } from '@glore/i18n'
import {
  defineCookies,
  type CookieKeyOptions,
  type CookieOptions,
  type DefineCookiesOptions,
} from '@glore/utils/cookies'
import { decode, encode } from '@glore/utils/encode'

import { type CourseTab } from '@/hooks/use-course'
import { type Course, type User } from '@/lib/api'
import { type CourseListView } from '@/lib/navigation'

export interface LocalStorage {
  theme: keyof typeof theme.modes
}

export type LocalStorageItem = keyof LocalStorage

export interface Cookies {
  'course-locale': Record<Course['slug'], Locale>
  'course-list-locales': Locale[]
  'course-list-view': CourseListView
  'course-tab': Record<Course['slug'], CourseTab>
  'login-token': string | null
  NEXT_LOCALE: Locale
  org: number
  'sidebar-open': boolean
  user: User
}

export type Cookie = keyof Cookies

export const cookieOptions = {
  expires: 60 * 60 * 24 * 30,
  prefix: process.env.COOKIE_PREFIX,
  resets: ['course-list-locales', 'course-list-view', 'course-tab'],
} as const satisfies DefineCookiesOptions<Cookies>

export const cookies = defineCookies<Cookies>(cookieOptions)

export const createCookieClient = async () => {
  const nextCookies = await (await import('next/headers')).cookies()

  const prefixKey = (key: Cookie, { prefix }: CookieKeyOptions) => {
    if (prefix === false) return key
    if (!prefix) prefix = cookieOptions.prefix
    return prefix ? `${prefix}${key}` : key
  }

  const unprefixKey = (key: string, { prefix }: CookieKeyOptions) => {
    if (prefix === false) return key
    if (!prefix) prefix = cookieOptions.prefix
    return (prefix ? key.replace(prefix, '') : key) as Cookie
  }

  return {
    /** Deletes the specified cookies. */
    delete<T extends Cookie | Cookie[]>(keys: T, options: CookieKeyOptions = {}) {
      const { prefix, ...opts } = { ...cookieOptions, ...options }

      for (const key of Array.isArray(keys) ? keys : [keys]) {
        const cookieKey = key as Cookie
        if (!this.has(cookieKey)) return
        nextCookies.delete({ ...opts, name: prefixKey(cookieKey, { prefix }) })
      }
    },
    /** Deletes all cookie data. */
    deleteAll(options: CookieKeyOptions = {}) {
      const keys = Object.keys(this.getAll(options)) as Cookie[]
      this.delete(keys, options)
    },
    /** Gets a cookie value by its name. */
    get<T extends Cookie>(key: T, options: CookieKeyOptions = {}) {
      const { value } = nextCookies.get(prefixKey(key, options)) ?? {}
      if (!value) return

      try {
        return JSON.parse(value) as Cookies[T]
      } catch {
        return value as Cookies[T]
      }
    },
    /** Gets all the defined cookies. */
    getAll(options: CookieKeyOptions = {}) {
      const keys = Object.keys(nextCookies.getAll())

      return keys.reduce((cookies, key) => {
        const cookieKey = unprefixKey(key, options)
        return { ...cookies, [cookieKey]: this.get(cookieKey as Cookie, options) }
      }, {} as Cookies)
    },
    /** Gets and decodes a cookie value by its name. */
    getEncoded<T extends Cookie>(key: T, options: CookieKeyOptions = {}) {
      const value = this.get(key, options)
      return value ? decode(value) : value
    },
    /** Checks if a cookie exists. */
    has<T extends Cookie>(key: T, options: CookieKeyOptions = {}) {
      return nextCookies.has(prefixKey(key, options))
    },
    /** Deletes the cookies specified by the `resets` option. */
    reset(options: CookieKeyOptions = {}) {
      if (!cookieOptions.resets) return
      this.delete(cookieOptions.resets, options)
    },
    /** Sets a cookie with the specified name, value and options. */
    set<T extends Cookie>(key: T, value: Cookies[T], options?: CookieOptions) {
      const { prefix, resets, ...params } = { ...options, ...cookieOptions }
      const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
      return nextCookies.set(key, cookieValue, params)
    },
    /** Encodes and sets a cookie with the specified name, value and options. */
    setEncoded<T extends Cookie>(key: T, value: Cookies[T], options?: CookieOptions) {
      return this.set(key, encode(value) as Cookies[T], options)
    },
  }
}
