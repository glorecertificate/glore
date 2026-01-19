'use server'

import 'server-only'

import { cookies as nextCookies } from 'next/headers'

import { type Locale } from 'next-intl'

import {
  COOKIE_OPTIONS,
  COOKIE_PREFIX,
  type CookieName,
  type CookieOptions,
  type CookieValue,
  cookieOptions,
  parseCookie,
  stringifyCookie,
} from '@/lib/cookies'
import { i18n } from '@/lib/i18n'

export const cookies = async () => {
  const { get, set, delete: deleteCookie } = await nextCookies()

  return {
    get: <T extends CookieName>(name: T, fallback?: CookieValue<T>) =>
      parseCookie(get(`${COOKIE_PREFIX}${name}`)?.value, fallback),
    set: <T extends CookieName>(name: T, value: CookieValue<T>, options?: CookieOptions) =>
      set(`${COOKIE_PREFIX}${name}`, stringifyCookie(value), cookieOptions(options)),
    delete: (name: CookieName) => deleteCookie(`${COOKIE_PREFIX}${name}`),
  }
}

export const getCookie = async <T extends CookieName>(name: T, fallback?: CookieValue<T>) => {
  const { get } = await cookies()
  return get(name, fallback)
}

export const setCookie = async <T extends CookieName>(name: T, value: CookieValue<T>, options?: CookieOptions) => {
  const { set } = await cookies()
  set(name, value, options)
}

export const deleteCookie = async (name: CookieName) => {
  const { delete: deleteCookie } = await cookies()
  deleteCookie(name)
}

export const getLocaleCookie = async () => {
  const { get } = await nextCookies()
  const value = get(i18n.cookie)?.value as Locale
  if (!(value && i18n.locales.includes(value))) return
  return value
}

export const setLocaleCookie = async (locale: Locale) => {
  const { set } = await nextCookies()
  set(i18n.cookie, locale, COOKIE_OPTIONS)
}
