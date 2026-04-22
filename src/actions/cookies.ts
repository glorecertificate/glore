'use server'

import 'server-only'

import { type Locale } from 'next-intl'

import {
  COOKIE_OPTIONS,
  COOKIE_PREFIX,
  type CookieName,
  type CookieOptions,
  type CookieValue,
  prefixCookieName,
} from '@/lib/cookies'
import { i18n } from '@/lib/i18n'

export const cookies = async () => {
  const { cookies: nextCookies } = await import('next/headers')
  const { get, set, delete: removeCookieEntry } = await nextCookies()

  return {
    delete: (name: CookieName, options?: CookieOptions) => {
      const { prefix = COOKIE_PREFIX } = options ?? {}
      removeCookieEntry(prefixCookieName(name, prefix))
    },
    get: <T extends CookieName>(name: T, options?: CookieOptions<{ fallback?: CookieValue<T> }>) => {
      const { fallback, prefix = COOKIE_PREFIX } = options ?? {}
      const value = get(prefixCookieName(name, prefix))?.value

      try {
        if (!value) throw Error()
        return JSON.parse(value) as CookieValue<T>
      } catch {
        return (value ?? fallback) as CookieValue<T>
      }
    },
    set: <T extends CookieName>(
      name: T,
      value: CookieValue<T>,
      options?: CookieOptions<Omit<CookieInit, 'name' | 'value'>>
    ) => {
      const { domain, expires, prefix = COOKIE_PREFIX, ...cookieOptions } = options ?? {}
      const cookieName = prefixCookieName(name, prefix)
      const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)

      set(cookieName, cookieValue, {
        ...COOKIE_OPTIONS,
        ...cookieOptions,
        domain: domain ?? undefined,
        expires: expires ?? undefined,
      })
    },
  }
}

export const getCookie = async <T extends CookieName>(
  name: T,
  options?: CookieOptions<{
    fallback?: CookieValue<T>
  }>
) => {
  const { get } = await cookies()
  return get(name, options)
}

export const setCookie = async <T extends CookieName>(
  name: T,
  value: CookieValue<T>,
  options?: CookieOptions<Omit<CookieInit, 'name' | 'value'>>
) => {
  const { set } = await cookies()
  set(name, value, options)
}

export const deleteCookie = async (name: CookieName, options?: CookieOptions) => {
  const { delete: remove } = await cookies()
  remove(name, options)
}

export const getLocaleCookie = async () => {
  const value = await getCookie(i18n.cookie, { prefix: false })
  if (value && i18n.locales.includes(value)) {
    return value
  }
}

export const setLocaleCookie = async (locale: Locale) => await setCookie(i18n.cookie, locale, { prefix: false })
