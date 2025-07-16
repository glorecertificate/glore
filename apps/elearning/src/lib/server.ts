'use server'

import { cookies } from 'next/headers'

import { parseCookieKey, type Cookie, type CookieKeyOptions, type CookieOptions, type CookieValue } from '@/lib/storage'

/**
 * Gets a cookie by its name.
 *
 * The function retrieves a cookie from the server-side context, to get
 * the value from the client import `cookies` from '@/lib/storage' instead.
 */
export const getCookie = async <T extends Cookie>(cookie: T, options?: CookieKeyOptions) => {
  const { get } = await cookies()
  const { value } = get(parseCookieKey(cookie, options)) ?? {}
  if (!value) return undefined

  try {
    return JSON.parse(value) as CookieValue<T>
  } catch {
    return value as CookieValue<T>
  }
}

/**
 * Sets a cookie with the specified name, value and options.
 *
 * The function sets a cookie from the server-side context, to set
 * the value from the client import `cookies` from '@/lib/storage' instead.
 */
export const setCookie = async <T extends Cookie>(cookie: T, value: CookieValue<T>, options?: CookieOptions) => {
  const { set } = await cookies()
  const { prefix, separator, ...cookieOptions } = options || {}
  set(parseCookieKey(cookie, { prefix, separator }), JSON.stringify(value), cookieOptions)
}

/**
 * Removes a cookie by its name.
 *
 * The function deletes a cookie from the server-side context, to delete
 * the value on the client import `cookies` from '@/lib/storage' instead.
 */
export const deleteCookie = async (cookie: Cookie, options: CookieKeyOptions) => {
  const { delete: _delete } = await cookies()
  _delete(parseCookieKey(cookie, options))
}
