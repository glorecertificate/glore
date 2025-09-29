import { decode, encode } from './encode'
import { isServer } from './is-server'

/**
 * Options for settings the HTTP `Set-Cookie` response header, used to send a cookie from the server to the user agent,
 * so that the user agent can send it back to the server later.
 *
 * To send multiple cookies, multiple Set-Cookie headers should be sent in the same response.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie).
 */
export interface CookieOptions {
  /**
   * Defines the host to which the cookie will be sent, which can only be the current or higher order domain.
   *
   * If omitted, it defaults to the host of the current document URL, not including subdomains.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Set-Cookie#domaindomain-value).
   *
   * @default null
   */
  domain?: string | null
  /**
   * Indicates the maximum lifetime of the cookie as an HTTP-date timestamp.
   *
   * If not specified, defaults to 30 days from the time the cookie is set.
   * When set to `null`, the cookie becomes a session cookie and terminates when the client shuts down.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Set-Cookie#expiresdate).
   *
   * @default 259200000
   */
  expires?: DOMHighResTimeStamp | null
  /**
   * Indicates that the cookie should be stored using partitioned storage. If set, the `Secure` directive must also be set.
   * See [Cookies Having Independent Partitioned State (CHIPS)](https://developer.mozilla.org/docs/Web/Privacy/Guides/Privacy_sandbox/Partitioned_cookies)
   * for more details.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie#partitioned).
   *
   * @default false
   */
  partitioned?: boolean
  /**
   * Indicates the path that must exist in the requested URL for the browser to send the `Cookie` header.
   *
   * If omitted, this attribute defaults to the path component of the request URL.
   * For example, if a cookie is set by a request to https://example.com/docs/HTTP/index.html, the default path will be `/docs/HTTP/`.
   *
   * The forward slash character is interpreted as a directory separator, with subdirectories matched as well.
   * For example, `Path=/docs` will match paths `/docs`, `/docs/`, and `/docs/HTTP/`, while `/`, `/docsets`, `/fr/docs` will not match.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie#pathpath-value).
   *
   * @default '/'
   */
  path?: string
  /**
   * Controls whether or not a cookie is sent with cross-site requests, blocking requests originating from a different site than the site that set the cookie.
   * This provides some protection against certain cross-site attacks, including [cross-site request forgery (CSRF)](https://developer.mozilla.org/docs/Glossary/CSRF) attacks.
   *
   * The possible attribute values are:
   * - `lax` will send the cookie only for requests originating from the same site that sets the cookie, and for cross-site requests that meet certain criteria.
   * - `strict` will send the cookie only for requests originating from the same site that sets the cookie.
   * - `none` will send cookie with both cross-site and same-site requests. The `Secure` attribute must also be set when using this value.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value).
   */
  sameSite?: CookieSameSite
}

const COOKIE_OPTIONS = {
  domain: null,
  expires: 60 * 60 * 24 * 30 * 1000, // 30 days
  partitioned: false,
  path: '/',
} satisfies CookieOptions

const COOKIE_OPTIONS_MAP = {
  domain: 'Domain',
  expires: 'Expires',
  partitioned: 'Partitioned',
  path: 'Path',
  sameSite: 'SameSite',
} satisfies Record<keyof CookieOptions, string>

/**
 * Client-side cookie management.
 */
export const defineCookies = <T extends Record<string, any>>(cookieOptions: CookieOptions = {}) => ({
  /**
   * Deletes the specified cookies.
   */
  delete(...cookies: (keyof T)[]) {
    if (isServer()) return

    for (const cookie of cookies) {
      if (!this.has(cookie)) return
      document.cookie = `${String(cookie)}=;`
    }
  },
  /**
   * Gets a cookie value by its name.
   */
  get<C extends keyof T>(cookie: C) {
    if (isServer()) return undefined

    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')

    for (let name of cookieArray) {
      while (name.startsWith(' ')) name = name.substring(1)

      if (!name.startsWith(String(cookie))) continue

      const value = name.substring(String(cookie).length, name.length)

      try {
        return JSON.parse(value) as T[C]
      } catch {
        return value as T[C]
      }
    }

    return undefined
  },
  /**
   * Gets all available cookies.
   */
  getAll() {
    if (isServer()) return {}

    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')
    const cookies: Record<string, string> = {}

    for (let name of cookieArray) {
      while (name.startsWith(' ')) name = name.substring(1)

      const separatorIndex = name.indexOf('=')
      if (separatorIndex === -1) continue

      const key = name.substring(0, separatorIndex)
      const value = name.substring(separatorIndex + 1, name.length)

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
  getEncoded<C extends keyof T>(cookie: C) {
    if (isServer()) return undefined

    const value = this.get(cookie)
    return decode(value)
  },
  /**
   * Checks if a cookie exists.
   */
  has(cookie: keyof T) {
    if (isServer()) return false

    return document.cookie.split(';').some(key => key.trim().startsWith(`${String(cookie)}=`))
  },
  /**
   * Sets a cookie with the specified name, value and options.
   */
  set<C extends keyof T>(cookie: C, value: T[C], options?: CookieOptions) {
    if (isServer()) return

    const params = { ...COOKIE_OPTIONS, ...cookieOptions, ...options }
    const args = [`${String(cookie)}=${JSON.stringify(value)}`]

    for (const [key, value] of Object.entries(params)) {
      if (!value) continue
      const cookieKey = COOKIE_OPTIONS_MAP[key as keyof CookieOptions]
      if (!cookieKey) continue
      args.push(`${cookieKey}=${value}`)
    }

    document.cookie = args.join('; ')
  },
  /**
   * Encodes and sets a cookie with the specified name, value and options.
   */
  setEncoded<C extends keyof T>(cookie: C, value: T[C], options?: CookieOptions) {
    if (isServer()) return

    this.set(cookie, encode(value) as T[C], options)
  },
})

export const defineAsyncCookies = <T extends Record<string, string> = Record<string, string>>(
  cookieOptions: CookieOptions = {},
) => ({
  /**
   * Deletes the specified cookies.
   */
  async delete(...cookies: (keyof T)[]) {
    if (isServer()) return

    for (const cookie of cookies) {
      if (!this.has(cookie)) return
      await cookieStore.delete(String(cookie))
    }
  },
  /**
   * Gets a cookie value by its name.
   */
  async get<C extends keyof T>(cookie: C) {
    if (isServer()) return undefined

    const { value } = (await cookieStore.get(String(cookie))) ?? {}
    if (!value) return undefined

    try {
      return JSON.parse(value) as T[C]
    } catch {
      return value as T[C]
    }
  },
  /**
   * Gets all available cookies.
   */
  async getAll() {
    if (isServer()) return {} as Partial<T>

    return Object.entries(await cookieStore.getAll()).reduce((all, [k, { value }]) => {
      if (!value) return { ...all, [k]: undefined }

      try {
        return { ...all, [k]: JSON.parse(value) }
      } catch {
        return { ...all, [k]: value }
      }
    }, {} as Partial<T>)
  },
  /**
   * Gets and decodes a cookie value by its name.
   */
  async getEncoded<C extends keyof T>(cookie: C) {
    if (isServer()) return undefined

    const value = await this.get(cookie)
    return decode(value)
  },
  /**
   * Checks if a cookie exists.
   */
  has(cookie: keyof T) {
    if (isServer()) return false

    return document.cookie.split(';').some(key => key.trim().startsWith(`${String(cookie)}=`))
  },
  /**
   * Sets a cookie with the specified name, value and options.
   */
  async set<C extends keyof T>(cookie: C, value: T[C], options?: CookieOptions) {
    if (isServer()) return

    const params = { ...COOKIE_OPTIONS, ...cookieOptions, ...options }

    cookieStore.set({
      name: String(cookie),
      value: JSON.stringify(value),
      ...params,
    })
  },
  /**
   * Encodes and sets a cookie with the specified name, value and options.
   */
  async setEncoded<C extends keyof T>(cookie: C, value: T[C], options?: CookieOptions) {
    if (isServer()) return

    await this.set(cookie, encode(value) as T[C], options)
  },
})
