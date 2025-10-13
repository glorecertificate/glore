import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { decodeAsync, encodeAsync } from './encode'
import { capitalize } from './string'
import { type Any, type AnyRecord } from './types'

/**
 * Options for defining a cookie store passed to {@link defineCookies}.
 */
export interface CookiesConfig<T extends AnyRecord> extends CookieOptions {
  /**
   * Specifies an array of cookie names to be deleted when the `reset` method is called.
   */
  resets?: (keyof T)[]
}

/**
 * Options for configuring a cookie.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/HTTP/Guides/Cookies|MDN Reference}
 */
export interface CookieOptions extends Omit<CookieInit, 'domain' | 'expires' | 'name' | 'value'> {
  expires?: number | Date
  domain?: string
  prefix?: string | false
}

type NextCookies = () => Promise<ReadonlyRequestCookies>

const createPrefixer =
  <T>(prefix?: string) =>
  <K extends keyof T>(key: K, options?: CookieOptions) => {
    if (options?.prefix === false) return String(key)
    const cookiePrefix = options?.prefix ?? prefix
    return cookiePrefix ? `${cookiePrefix}${String(key)}` : String(key)
  }

const createUnprefixer =
  <T>(prefix?: string) =>
  <K extends keyof T>(key: K, options?: CookieOptions) => {
    if (options?.prefix === false) return String(key)
    const cookiePrefix = options?.prefix ?? prefix
    return cookiePrefix ? String(key).replace(String(cookiePrefix), '') : String(key)
  }

/**
 * Returns a {@link CookieStore} providing methods to manage cookies in a browser environment.
 */
export const defineCookies = <T extends AnyRecord>(config: CookiesConfig<T> = {}) => {
  const { resets, prefix, ...cookieOptions } = config
  const prefixKey = createPrefixer<T>(prefix || '')
  const unprefixKey = createUnprefixer<T>(prefix || '')

  return {
    /**
     * Cookie configuration options.
     */
    config,
    /**
     * Deletes all cookie data.
     */
    clear(options?: CookieOptions) {
      this.delete(Object.keys(this.getAll(options)) as (keyof T)[], options)
    },
    /**
     * Deletes the specified cookies.
     */
    delete(keys: keyof T | (keyof T)[], options?: CookieOptions) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (!this.has(key, options)) return
        document.cookie = `${prefixKey(key, options)}=;`
      }
    },
    /**
     * Gets a cookie value by its name.
     */
    get<K extends keyof T>(key: K, options?: CookieOptions) {
      const cookieKey = prefixKey(key, options)
      const chunks = decodeURIComponent(document.cookie).split(';')
      let value: Any

      for (let chunk of chunks) {
        while (chunk.startsWith(' ')) chunk = chunk.substring(1)
        if (!chunk.startsWith(`${cookieKey}=`)) continue
        const stringValue = chunk.substring(cookieKey.length + 1, chunk.length)

        try {
          value = JSON.parse(stringValue)
        } catch {
          value = stringValue
        }
        break
      }

      return value as T[K]
    },
    /**
     * Gets all available cookies.
     */
    getAll(options?: CookieOptions) {
      const cookies: Record<string, string> = {}
      const chunks = decodeURIComponent(document.cookie).split(';')

      for (let chunk of chunks) {
        while (chunk.startsWith(' ')) chunk = chunk.substring(1)
        const index = chunk.indexOf('=')
        if (index === -1) continue
        const name = chunk.substring(0, index)
        const key = unprefixKey(name as keyof T, options)
        const value = chunk.substring(index + 1, chunk.length)

        try {
          cookies[key] = JSON.parse(value)
        } catch {
          cookies[key] = value ?? undefined
        }
      }
      return cookies as Partial<T>
    },
    /**
     * Gets and decodes a cookie value by its name.
     */
    getEncoded<K extends keyof T>(key: K, options?: CookieOptions) {
      const value = this.get(key, options)
      const encodeValue = typeof value === 'string' ? value : JSON.stringify(value)
      return atob(encodeValue) as T[K]
    },
    /**
     * Checks if a cookie exists.
     */
    has(key: keyof T, options?: CookieOptions) {
      return document.cookie.split(';').some(k => k.trim().startsWith(`${prefixKey(key, options)}=`))
    },
    /**
     * Deletes the cookies specified by the `resets` option.
     */
    reset(options?: CookieOptions) {
      if (!resets?.length) return
      this.delete(resets, options)
    },
    /**
     * Sets a cookie with the specified name, value and options.
     */
    set<K extends keyof T>(key: K, value: T[K], options?: CookieOptions) {
      const { prefix, ...params } = { ...cookieOptions, ...options }
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      const args = [`${prefixKey(key, { prefix })}=${serializedValue}`]

      for (const [key, value] of Object.entries(params)) {
        if (!value) continue
        args.push(`${capitalize(key)}=${String(value)}`)
      }
      document.cookie = args.join('; ')
    },
    /**
     * Encodes and sets a cookie with the specified name, value and options.
     */
    setEncoded<K extends keyof T>(key: K, value: T[K], options?: CookieOptions) {
      const encodeValue = typeof value === 'string' ? value : JSON.stringify(value)
      this.set(key, btoa(encodeValue) as T[keyof T], options)
    },
  }
}

/**
 * Returns a set of utility functions to manage cookies safely in a server-side context.
 */
export const defineServerCookies = <T extends AnyRecord>(cookies: NextCookies, config: CookiesConfig<T> = {}) => {
  const { resets, prefix, ...cookieOptions } = config ?? {}
  const prefixKey = createPrefixer<T>(prefix || '')
  const unprefixKey = createUnprefixer<T>(prefix || '')

  return async () => {
    const store = await cookies()

    return {
      /**
       * Cookie configuration options.
       */
      config,
      /**
       * Deletes all cookie data.
       */
      clear(options?: CookieOptions) {
        this.delete(Object.keys(this.getAll(options)) as (keyof T)[], options)
      },
      delete(keys: keyof T | (keyof T)[], options?: CookieOptions) {
        const names = (Array.isArray(keys) ? keys : [keys]).map(key => prefixKey(key, options))
        for (const name of names) {
          store.delete({ name, ...options })
        }
      },
      /**
       * Gets a cookie value by its name.
       */
      get<K extends keyof T>(key: K, options?: CookieOptions) {
        const value = store.get(prefixKey(key, options))?.value
        try {
          return JSON.parse(String(value)) as T[K]
        } catch {
          return value as T[K] | undefined
        }
      },
      /**
       * Gets all available cookies.
       */
      getAll(options?: CookieOptions) {
        const cookiesRecord = {} as T

        for (const { name, value } of store.getAll()) {
          const key = unprefixKey(name, options) as keyof T

          try {
            cookiesRecord[key] = JSON.parse(String(value))
          } catch {
            cookiesRecord[key] = value as T[typeof key]
          }
        }
        return cookiesRecord
      },
      /**
       * Gets and decodes a cookie value by its name.
       */
      async getEncoded<K extends keyof T>(key: K, options?: CookieOptions) {
        const encoded = store.get(prefixKey(key, options))?.value
        const value = encoded ? await decodeAsync(encoded) : undefined
        try {
          return JSON.parse(String(value)) as T[K]
        } catch {
          return value as T[K] | undefined
        }
      },
      /**
       * Checks if a cookie exists.
       */
      has(key: keyof T, options: CookieOptions) {
        return store.has(prefixKey(key, options))
      },
      /**
       * Deletes the cookies specified by the `resets` option configuration.
       */
      reset(options?: CookieOptions) {
        if (!resets) return
        for (const name of resets) {
          const key = prefixKey(name, options)
          store.delete(key)
        }
      },
      /**
       * Sets a cookie with the specified name, value and options.
       */
      set<K extends keyof T>(key: K, value: T[K], options?: CookieOptions) {
        store.set({ name: prefixKey(key, options), value: String(value), ...cookieOptions, ...options })
      },
      /**
       * Encodes and sets a cookie with the specified name, value and options.
       */
      async setEncoded<K extends keyof T>(key: K, value: T[K], options?: CookieOptions) {
        const encoded = typeof value === 'string' ? value : JSON.stringify(value)
        store.set({
          name: prefixKey(key, options),
          value: String(await encodeAsync(encoded)),
          ...cookieOptions,
          ...options,
        })
      },
    }
  }
}
