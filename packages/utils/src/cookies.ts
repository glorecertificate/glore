import { decode, encode } from './encode'
import { capitalize } from './string'
import { type AnyRecord } from './types'

/**
 * Options for configuring cookies.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/HTTP/Guides/Cookies|MDN Reference}
 */
export interface CookieOptions extends Omit<CookieInit, 'domain' | 'name' | 'value'>, CookieKeyOptions {
  domain?: string
}

/**
 * Options for manipulating cookie keys.
 */
export interface CookieKeyOptions {
  prefix?: string | false
}

/**
 * Options passed to {@link defineCookies}.
 */
export interface DefineCookiesOptions<T extends AnyRecord = AnyRecord> extends CookieOptions {
  /**
   * Specifies an array of cookie names to be deleted when the `reset` method is called.
   */
  resets?: (keyof T)[]
}

/**
 * Methods available for cookie manipulation.
 */
export type CookieMethod =
  | 'delete'
  | 'deleteAll'
  | 'get'
  | 'getAll'
  | 'getEncoded'
  | 'has'
  | 'reset'
  | 'set'
  | 'setEncoded'

/**
 * Defines a set of utility functions to manage cookies in the browser and server-side rendering contexts.
 */
export const defineCookies = <T extends AnyRecord>(cookieOptions: DefineCookiesOptions<T> = {}) => {
  const prefixKey = <K extends keyof T>(key: K, { prefix }: Pick<CookieOptions, 'prefix'>) => {
    if (prefix === false) return String(key)
    if (!prefix) prefix = cookieOptions.prefix
    return prefix ? `${prefix}${String(key)}` : String(key)
  }

  const unprefixKey = (key: keyof T, { prefix }: Pick<CookieOptions, 'prefix'>) => {
    if (prefix === false) return String(key)
    if (!prefix) prefix = cookieOptions.prefix
    return prefix ? String(key).replace(String(prefix), '') : String(key)
  }

  return {
    /**
     * Deletes the specified cookies.
     */
    delete(keys: keyof T | (keyof T)[], options: Pick<CookieOptions, 'prefix'> = {}) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (!this.has(key)) return
        document.cookie = `${prefixKey(key, options)}=;`
      }
    },
    /**
     * Deletes all cookie data.
     */
    deleteAll(options: Pick<CookieOptions, 'prefix'> = {}) {
      this.delete(Object.keys(this.getAll()), options)
    },
    /**
     * Gets a cookie value by its name.
     */
    get<K extends keyof T>(key: K, options: Pick<CookieOptions, 'prefix'> = {}) {
      const cookieKey = prefixKey(key, options)
      const chunks = decodeURIComponent(document.cookie).split(';')

      for (let chunk of chunks) {
        while (chunk.startsWith(' ')) chunk = chunk.substring(1)
        if (!chunk.startsWith(cookieKey)) continue

        const value = chunk.substring(cookieKey.length, chunk.length)

        try {
          return JSON.parse(value) as T[K]
        } catch {
          return value as T[K]
        }
      }
      return
    },
    /**
     * Gets all available cookies.
     */
    getAll(options: Pick<CookieOptions, 'prefix'> = {}) {
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
    getEncoded<K extends keyof T>(key: K, options: Pick<CookieOptions, 'prefix'> = {}) {
      const value = this.get(key, options)
      return decode(value)
    },
    /**
     * Checks if a cookie exists.
     */
    has(key: keyof T, options: Pick<CookieOptions, 'prefix'> = {}) {
      return document.cookie.split(';').some(k => k.trim().startsWith(`${prefixKey(key, options)}=`))
    },
    /**
     * Deletes the cookies specified by the `resets` option.
     */
    reset(options: Pick<CookieOptions, 'prefix'> = {}) {
      if (!cookieOptions.resets) return
      this.delete(cookieOptions.resets, options)
    },
    /**
     * Sets a cookie with the specified name, value and options.
     */
    set<K extends keyof T>(key: K, value: T[K], options: CookieOptions = {}) {
      const { prefix, ...params } = { ...cookieOptions, ...options }
      const args = [`${prefixKey(key, { prefix })}=${JSON.stringify(value)}`]

      for (const [key, value] of Object.entries(params)) {
        if (!value) continue
        const option = capitalize(key)
        if (!option) continue
        args.push(`${option}=${String(value)}`)
      }

      document.cookie = args.join('; ')
    },
    /**
     * Encodes and sets a cookie with the specified name, value and options.
     */
    setEncoded<K extends keyof T>(key: K, value: T[K], options: CookieOptions = {}) {
      this.set(key, encode(value) as T[K], options)
    },
  }
}
