'use server'

import { cookies } from 'next/headers'

import { decodeAsync, encodeAsync } from '@repo/utils/encode'

import { RESET_COOKIES, type Cookies } from './config'
import { type Cookie, type CookieKeyOptions, type CookieOptions } from './types'
import { parseCookieKey } from './utils'

/**
 * Gets a cookie server-side by its name.
 */
export const getCookie = async <T extends Cookie>(cookie: T, options?: CookieKeyOptions) => {
  const { get } = await cookies()
  const { value } = get(parseCookieKey(cookie, options)) ?? {}
  if (!value) return undefined

  try {
    return JSON.parse(value) as Cookies[T]
  } catch {
    return value as Cookies[T]
  }
}

/**
 * Decodes and gets a cookie server-side by its name.
 */
export const getEncodedCookie = async <T extends Cookie>(cookie: T, options?: CookieKeyOptions) => {
  const value = await getCookie(cookie, options)
  if (!value) return value

  return await decodeAsync(value)
}

/**
 * Sets a cookie server-side using the specified name, value and options.
 */
export const setCookie = async <T extends Cookie>(cookie: T, value: Cookies[T], options?: CookieOptions) => {
  const { set } = await cookies()
  const { prefix, ...cookieOptions } = options || {}
  const cookieKey = parseCookieKey(cookie, { prefix })
  const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
  set(cookieKey, cookieValue, cookieOptions)
}

/**
 * Encodes and sets a cookie server-side using the specified name, value and options.
 */
export const setEncodedCookie = async <T extends Cookie>(cookie: T, value: Cookies[T], options?: CookieOptions) => {
  const encoded = await encodeAsync(value)
  await setCookie(cookie, encoded as Cookies[T], options)
}

/**
 * Removes a cookie by its name.
 */
export const deleteCookie = async (cookie: Cookie, options?: CookieKeyOptions) => {
  const { delete: _delete } = await cookies()
  _delete(parseCookieKey(cookie, options))
}

/**
 * Deletes the specified cookies or the ones defined by `RESET_COOKIES`.
 */
export const deleteAllCookies = async (cookies: Cookie[] = RESET_COOKIES) => {
  for (const cookie of cookies) {
    await deleteCookie(cookie)
  }
}

/**
 * Checks if a cookie exists.
 */
export const hasCookie = async (cookie: Cookie, options?: CookieKeyOptions) => {
  const { has } = await cookies()
  return has(parseCookieKey(cookie, options))
}
