'use server'

import 'server-only'

import { cookies as nextCookies } from 'next/headers'

import { type Locale } from 'next-intl'

import { COOKIE_OPTIONS, COOKIE_PREFIX, type CookieName, type CookieValue, parseCookieValue } from '@/lib/cookies'
import { i18n } from '@/lib/i18n'

export const cookies = async () => {
  const { get, set, delete: _delete } = await nextCookies()

  return {
    get: <T extends CookieName>(name: T, fallback?: CookieValue<T>) =>
      parseCookieValue(get(`${COOKIE_PREFIX}${name}`)?.value, fallback),
    set: <T extends CookieName>(name: T, value: CookieValue<T>) =>
      set(`${COOKIE_PREFIX}${name}`, JSON.stringify(value)),
    delete: (name: CookieName) => _delete(`${COOKIE_PREFIX}${name}`),
  }
}

export const getCookie = async <T extends CookieName>(name: T, fallback?: CookieValue<T>) => {
  const { get } = await nextCookies()
  return parseCookieValue(get(name)?.value, fallback)
}

export const setCookie = async <T extends CookieName>(
  name: T,
  value: CookieValue<T>,
  { domain, expires, ...options }: Omit<CookieInit, 'name' | 'value'> = {}
) => {
  const { set } = await nextCookies()

  set(`${COOKIE_PREFIX}${name}`, typeof value === 'string' ? value : JSON.stringify(value), {
    ...COOKIE_OPTIONS,
    domain: domain || undefined,
    expires: expires || undefined,
    ...options,
  })
}

export const deleteCookie = async (name: CookieName) => {
  const { delete: _delete } = await nextCookies()
  _delete(`${COOKIE_PREFIX}${name}`)
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
