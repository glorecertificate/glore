import { decode, encode, isServer } from '@repo/utils'

import { RESET_COOKIES } from './config'
import { type Cookie, type CookieKeyOptions, type CookieOptions, type CookieValue } from './types'
import { parseCookieKey } from './utils'

/**
 * Client-side cookie management.
 */
export const cookies = {
  /**
   * Gets a cookie by its name.
   */
  get<T extends Cookie>(cookie: T, options?: CookieKeyOptions) {
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
   * Gets and decodes a cookie by its name.
   */
  getEncoded<T extends Cookie>(cookie: T, options?: CookieKeyOptions) {
    if (isServer()) return undefined
    const value = this.get(cookie, options) as string
    return decode(value) as CookieValue<T>
  },
  /**
   * Sets a cookie with the specified name, value and options.
   */
  set<T extends Cookie>(cookie: T, value: CookieValue<T>, options?: CookieOptions) {
    if (isServer()) return
    const { maxAge, path, prefix, separator } = { maxAge: 60 * 60 * 24 * 30, path: '/', ...(options ?? {}) }
    const cookieKey = parseCookieKey(cookie, { prefix, separator })
    const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
    document.cookie = `${cookieKey}=${cookieValue}; path=${path}; max-age=${maxAge}`
  },
  /**
   * Encodes and sets a cookie with the specified name, value and options.
   */
  setEncoded<T extends Cookie>(cookie: T, value: CookieValue<T>, options?: CookieOptions) {
    if (isServer()) return
    this.set(cookie, encode(value) as CookieValue<T>, options)
  },
  /**
   * Removes a cookie by its name.
   */
  delete(cookie: Cookie, options?: CookieKeyOptions) {
    if (isServer()) return
    document.cookie = `${parseCookieKey(cookie, options)}=; path=/; max-age=0`
  },
  /**
   * Deletes the specified cookies or the ones defined by `RESET_COOKIES`.
   */
  deleteAll(cookies: Cookie[] = RESET_COOKIES, options?: CookieKeyOptions) {
    if (isServer()) return
    for (const cookie of cookies) {
      if (!this.has(cookie, options)) return
      this.delete(cookie, options)
    }
  },
  /**
   * Checks if a cookie exists.
   */
  has(cookie: Cookie, options?: CookieKeyOptions) {
    if (isServer()) return false
    return document.cookie.split(';').some(c => c.trim().startsWith(`${parseCookieKey(cookie, options)}=`))
  },
}
