import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { decodeAsync, encodeAsync } from './encode'
import { capitalize } from './string'
import { type Any, type AnyRecord } from './types'

/**
 * Options to define a cookie store, passed to {@link defineCookies} and {@link defineServerCookies}.
 *
 * @template T - Record representing the cookies managed by the nextStore.
 */
export interface CookiesConfig<Cookies extends AnyRecord> extends CookieOptions {
  /**
   * Specifies an array of cookie names to be deleted when the `reset` method is called.
   */
  resets?: (keyof Cookies)[]
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
  <Cookies>(prefix?: string) =>
  <K extends keyof Cookies>(key: K, options?: CookieOptions) => {
    if (options?.prefix === false) return String(key)
    const cookiePrefix = options?.prefix ?? prefix
    return cookiePrefix ? `${cookiePrefix}${String(key)}` : String(key)
  }

const createUnprefixer =
  <Cookies>(prefix?: string) =>
  <K extends keyof Cookies>(key: K, options?: CookieOptions) => {
    if (options?.prefix === false) return String(key)
    const cookiePrefix = options?.prefix ?? prefix
    return cookiePrefix ? String(key).replace(String(cookiePrefix), '') : String(key)
  }

/**
 * Returns a {@link CookieStore} providing methods to manage cookies in a browser environment.
 */
export const defineCookies = <Cookies extends AnyRecord>(config: CookiesConfig<Cookies> = {}) => {
  const { resets, prefix, ...cookieOptions } = config
  const prefixKey = createPrefixer<Cookies>(prefix || '')
  const unprefixKey = createUnprefixer<Cookies>(prefix || '')

  return {
    /**
     * Cookie configuration options.
     */
    config,
    /**
     * Deletes all cookie data.
     */
    clear(options?: CookieOptions) {
      this.delete(Object.keys(this.getAll(options)) as (keyof Cookies)[], options)
    },
    /**
     * Deletes the specified cookies.
     */
    delete(keys: keyof Cookies | (keyof Cookies)[], options?: CookieOptions) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (!this.has(key, options)) return
        document.cookie = `${prefixKey(key, options)}=;`
      }
    },
    /**
     * Gets a cookie value by its name.
     */
    get<K extends keyof Cookies>(key: K, options?: CookieOptions) {
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

      return value as Cookies[K]
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
        const key = unprefixKey(name as keyof Cookies, options)
        const value = chunk.substring(index + 1, chunk.length)

        try {
          cookies[key] = JSON.parse(value)
        } catch {
          cookies[key] = value ?? undefined
        }
      }
      return cookies as Partial<Cookies>
    },
    /**
     * Gets and decodes a cookie value by its name.
     */
    getEncoded<K extends keyof Cookies>(key: K, options?: CookieOptions) {
      const value = this.get(key, options)
      const encodeValue = typeof value === 'string' ? value : JSON.stringify(value)
      return atob(encodeValue) as Cookies[K]
    },
    /**
     * Checks if a cookie exists.
     */
    has(key: keyof Cookies, options?: CookieOptions) {
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
    set<K extends keyof Cookies>(key: K, value: Cookies[K], options?: CookieOptions) {
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
    setEncoded<K extends keyof Cookies>(key: K, value: Cookies[K], options?: CookieOptions) {
      const encodeValue = typeof value === 'string' ? value : JSON.stringify(value)
      this.set(key, btoa(encodeValue) as Cookies[K], options)
    },
  }
}

/**
 * Returns a set of utility functions to manage cookies safely in a server-side context.
 */
export const defineServerCookies = <Cookies extends AnyRecord>(
  cookies: NextCookies,
  config: CookiesConfig<Cookies> = {}
) => {
  const { resets, prefix, ...cookieOptions } = config ?? {}
  const prefixKey = createPrefixer<Cookies>(prefix || '')
  const unprefixKey = createUnprefixer<Cookies>(prefix || '')

  return async () => {
    const nextStore = await cookies()

    return {
      /**
       * Cookie configuration options.
       */
      config,
      /**
       * Deletes all cookie data.
       */
      clear(options?: CookieOptions) {
        this.delete(Object.keys(this.getAll(options)) as (keyof Cookies)[], options)
      },
      delete(keys: keyof Cookies | (keyof Cookies)[], options?: CookieOptions) {
        const names = (Array.isArray(keys) ? keys : [keys]).map(key => prefixKey(key, options))
        for (const name of names) {
          nextStore.delete({ name, ...options })
        }
      },
      /**
       * Gets a cookie value by its name.
       */
      get<K extends keyof Cookies>(key: K, options?: CookieOptions) {
        const value = nextStore.get(prefixKey(key, options))?.value
        try {
          return JSON.parse(String(value)) as Cookies[K]
        } catch {
          return value as Cookies[K] | undefined
        }
      },
      /**
       * Gets all available cookies.
       */
      getAll(options?: CookieOptions) {
        const cookiesRecord = {} as Cookies

        for (const { name, value } of nextStore.getAll()) {
          const key = unprefixKey(name, options) as keyof Cookies

          try {
            cookiesRecord[key] = JSON.parse(String(value))
          } catch {
            cookiesRecord[key] = value as Cookies[typeof key]
          }
        }
        return cookiesRecord
      },
      /**
       * Gets and decodes a cookie value by its name.
       */
      async getEncoded<K extends keyof Cookies>(key: K, options?: CookieOptions) {
        const encoded = nextStore.get(prefixKey(key, options))?.value
        const value = encoded ? await decodeAsync(encoded) : undefined
        try {
          return JSON.parse(String(value)) as Cookies[K]
        } catch {
          return value as Cookies[K] | undefined
        }
      },
      /**
       * Checks if a cookie exists.
       */
      has(key: keyof Cookies, options: CookieOptions) {
        return nextStore.has(prefixKey(key, options))
      },
      /**
       * Deletes the cookies specified by the `resets` option configuration.
       */
      reset(options?: CookieOptions) {
        if (!resets) return
        for (const name of resets) {
          const key = prefixKey(name, options)
          nextStore.delete(key)
        }
      },
      /**
       * Sets a cookie with the specified name, value and options.
       */
      set<K extends keyof Cookies>(key: K, value: Cookies[K], options?: CookieOptions) {
        nextStore.set({ name: prefixKey(key, options), value: String(value), ...cookieOptions, ...options })
      },
      /**
       * Encodes and sets a cookie with the specified name, value and options.
       */
      async setEncoded<K extends keyof Cookies>(key: K, value: Cookies[K], options?: CookieOptions) {
        const encoded = typeof value === 'string' ? value : JSON.stringify(value)
        nextStore.set({
          name: prefixKey(key, options),
          value: String(await encodeAsync(encoded)),
          ...cookieOptions,
          ...options,
        })
      },
    }
  }
}
