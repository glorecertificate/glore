import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import { isServer, type Position } from '@repo/utils'

import { type User } from '@/api/modules/users/types'
import { type CourseTab } from '@/components/features/course-list'
import { Env } from '@/lib/env'
import { type Locale } from '@/lib/i18n/types'
import app from 'config/app.json'

/**
 * Application cookies values.
 */
export interface Cookies {
  'active-org': number
  'course-locales': Locale[]
  'course-tab': CourseTab
  locale: Locale
  'sidebar-open': boolean
  'supabase-widget-position': Position
  user: User
}

/**
 * Cookie name based on the `Cookies` interface.
 */
export type Cookie = keyof Cookies

/**
 * Cookie values based on the `Cookies` interface.
 */
export type CookieValue<T extends Cookie> = Cookies[T]

/**
 * Options for cookie names.
 */
export interface CookieKeyOptions {
  prefix?: string | boolean
  separator?: string
}

/**
 * Options for setting cookies.
 */
export interface CookieOptions extends Partial<ResponseCookie>, CookieKeyOptions {}

/**
 * Application local storage keys.
 */
export enum LocalStorage {}

/**
 * Public assets used across the application.
 */
export enum Public {
  Favicon = '/favicon.ico',
  Manifest = '/manifest.webmanifest',
}

/**
 * Remote assets relative to the base storage URL.
 */
export enum Asset {
  Logo = 'assets/logo.png',
  Trailer = 'assets/trailer.mp4',
  AppleIcon = 'metadata/apple-touch-icon.png',
  Favicon96 = 'metadata/favicon-96x96.png',
  OpenGraph = 'metadata/open-graph.png',
  WebAppIcon192 = 'metadata/web-app-icon-192x192.png',
  WebAppIcon512 = 'metadata/web-app-icon-512x512.png',
  WebAppScreenshotWide = 'metadata/web-app-screenshot-wide.png',
  WebAppScreenshotNarrow = 'metadata/web-app-screenshot-narrow.png',
}

/**
 * Generates a URL for an asset based on the environment's storage.
 */
export const asset = (asset: Asset | `${Asset}`) => `${Env.STORAGE_URL}/${asset}`

/**
 * Generates a cookie name based on the provided options or using the default prefix and separator.
 */
export const parseCookieKey = (cookie: Cookie, options?: CookieKeyOptions) => {
  const { prefix = app.cookiePrefix, separator = '.' } = options || {}
  return prefix ? `${prefix}${separator ?? ''}${cookie}` : cookie
}

export const cookies = {
  /**
   * Gets a cookie by its name.
   */
  get: <T extends Cookie>(cookie: T, options?: CookieKeyOptions) => {
    if (isServer()) return undefined

    const name = `${parseCookieKey(cookie, options)}=`
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')

    for (const cookie of cookieArray) {
      let c = cookie
      while (c.startsWith(' ')) {
        c = c.substring(1)
      }
      if (c.startsWith(name)) {
        return JSON.parse(c.substring(name.length, c.length)) as CookieValue<T>
      }
    }
    return undefined
  },
  /**
   * Sets a cookie with the specified name, value and options.
   */
  set: <T extends Cookie>(cookie: T, value: CookieValue<T>, options?: CookieOptions) => {
    if (isServer()) return
    const { maxAge, path, prefix, separator } = { maxAge: 60 * 60 * 24 * 30, path: '/', ...(options ?? {}) }
    document.cookie = `${parseCookieKey(cookie, { prefix, separator })}=${JSON.stringify(value)}; path=${path}; max-age=${maxAge}`
  },
  /**
   * Removes a cookie by its name.
   */
  delete: (cookie: Cookie, options?: CookieKeyOptions) => {
    if (isServer()) return
    document.cookie = `${parseCookieKey(cookie, options)}=; path=/; max-age=0`
  },
}
