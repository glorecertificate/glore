'use server'

import 'server-only'

import { cookies as nextCookies } from 'next/headers'

import type { Locale } from 'next-intl'

import { i18n } from '@/lib/i18n'
import type { Cookies } from '@/lib/storage'

const COOKIE_PREFIX = process.env.COOKIE_PREFIX ?? ''

type CookieFallback<T> = T extends keyof Cookies ? Cookies[T] | undefined : undefined

const parseCookieValue = <T extends keyof Cookies, F extends CookieFallback<T>>(
  get: Awaited<ReturnType<typeof nextCookies>>['get'],
  name: T,
  fallback?: F
) => {
  let value = get(`${COOKIE_PREFIX}${name}`)?.value
  try {
    if (!value) throw Error
    value = JSON.parse(value)
  } catch {
    value = fallback as string
  }
  return value as F extends undefined ? Cookies[T] | undefined : Cookies[T] | F
}

export const cookies = async () => {
  const cookieStore = await nextCookies()

  return {
    get: <T extends keyof Cookies, F extends CookieFallback<T>>(name: T, fallback?: F) =>
      parseCookieValue(cookieStore.get, name, fallback),
    set: <T extends keyof Cookies>(name: T, value: Cookies[T]) =>
      cookieStore.set(`${COOKIE_PREFIX}${name}`, JSON.stringify(value)),
    delete: (name: keyof Cookies) => cookieStore.delete(`${COOKIE_PREFIX}${name}`),
  }
}

export const getCookie = async <T extends keyof Cookies, F extends CookieFallback<T>>(name: T, fallback?: F) => {
  const { get } = await nextCookies()
  return parseCookieValue(get, name, fallback)
}

export const setCookie = async <T extends keyof Cookies>(name: T, value: Cookies[T]) => {
  const { set } = await nextCookies()
  const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
  set(`${COOKIE_PREFIX}${name}`, cookieValue)
}

export const deleteCookie = async (name: keyof Cookies) => {
  const { delete: _delete } = await nextCookies()
  _delete(`${COOKIE_PREFIX}${name}`)
}

export const getLocaleCookie = async () => {
  const { get } = await nextCookies()
  const value = get(i18n.cookie)?.value as Locale
  if (value && i18n.locales.includes(value)) {
    return value
  }
}

export const setLocaleCookie = async (locale: Locale) => {
  const { set } = await nextCookies()
  set(i18n.cookie, locale)
}
