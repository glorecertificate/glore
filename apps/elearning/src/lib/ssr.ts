import { cookies } from 'next/headers'

import { type CookieKeyOptions, type CookieOptions } from '@glore/utils/cookies'
import { decode, encode } from '@glore/utils/encode'
import { noop } from '@glore/utils/noop'
import { type AnyFunction } from '@glore/utils/types'

import { createClient } from '@/lib/api'
import { findUser } from '@/lib/api/modules/users'
import { type Database, type DatabaseClient } from '@/lib/db'
import { COOKIE_OPTIONS, type Cookie, type Cookies } from '@/lib/storage'

/**
 * Creates a server-side database client.
 */
export const createDatabaseClient = async (callback: AnyFunction = noop): Promise<DatabaseClient> => {
  const { cookies } = await import('next/headers')
  const { createServerClient } = await import('@supabase/ssr')

  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll,
      setAll(cookies) {
        for (const { name, options, value } of cookies) {
          set(name, value, options)
        }
        callback()
      },
    },
  })
}

/**
 * Creates a server-side API client.
 */
export const createApiClient = async () => {
  const db = await createDatabaseClient()
  return createClient(db)
}

/**
 * Creates a server-side cookie client.
 */
export const createCookieStore = async () => {
  const nextCookies = await cookies()

  const prefixKey = (key: Cookie, { prefix }: CookieKeyOptions) => {
    if (prefix === false) return key
    if (!prefix) prefix = COOKIE_OPTIONS.prefix
    return prefix ? `${prefix}${key}` : key
  }

  const unprefixKey = (key: string, { prefix }: CookieKeyOptions) => {
    if (prefix === false) return key
    if (!prefix) prefix = COOKIE_OPTIONS.prefix
    return (prefix ? key.replace(prefix, '') : key) as Cookie
  }

  return {
    /** Deletes the specified cookies. */
    delete<T extends Cookie | Cookie[]>(keys: T, options: CookieKeyOptions = {}) {
      const { prefix, ...opts } = { ...COOKIE_OPTIONS, ...options }

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
    async getEncoded<T extends Cookie>(key: T, options: CookieKeyOptions = {}) {
      const value = this.get(key, options)
      return value ? await decode.async(value) : value!
    },
    /** Checks if a cookie exists. */
    has<T extends Cookie>(key: T, options: CookieKeyOptions = {}) {
      return nextCookies.has(prefixKey(key, options))
    },
    /** Deletes the cookies specified by the `resets` option. */
    reset(options: CookieKeyOptions = {}) {
      if (!COOKIE_OPTIONS.resets) return
      this.delete(COOKIE_OPTIONS.resets, options)
    },
    /** Sets a cookie with the specified name, value and options. */
    set<T extends Cookie>(key: T, value: Cookies[T], options?: CookieOptions) {
      const { prefix, resets, ...params } = { ...options, ...COOKIE_OPTIONS }
      const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
      return nextCookies.set(key, cookieValue, params)
    },
    /** Encodes and sets a cookie with the specified name, value and options. */
    async setEncoded<T extends Cookie>(key: T, value: Cookies[T], options?: CookieOptions) {
      return this.set(key, (await encode.async(value)) as Cookies[T], options)
    },
  }
}

/**
 * Gets the current authenticated user from the cookies.
 */
export const getCurrentUser = async () => {
  const db = await createDatabaseClient()
  const cookies = await createCookieStore()
  const user = cookies.getEncoded('user')
  if (user) return user

  const { data, error } = await db.auth.getUser()
  if (error || !data?.user) throw Error()

  const currentUser = await findUser(db, data.user.id)
  if (!currentUser) throw Error()

  return currentUser
}
