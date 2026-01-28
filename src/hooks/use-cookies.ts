import { COOKIE_OPTIONS, type CookieName, type CookieOptions, type CookieValue, prefixCookieName } from '@/lib/cookies'

/**
 * Returns a custom cookie store providing methods to manage cookies in the browser.
 */
export const useCookies = () => ({
  get<T extends CookieName>(name: T, options?: CookieOptions<{ fallback?: CookieValue<T> }>) {
    const cookieKey = prefixCookieName(name, options?.prefix)
    const chunks = decodeURIComponent(document.cookie).split(';')
    let value: CookieValue<T> | string | undefined

    for (let chunk of chunks) {
      while (chunk.startsWith(' ')) chunk = chunk.substring(1)
      if (!chunk.startsWith(`${cookieKey}=`)) continue

      const text = chunk.substring(cookieKey.length + 1, chunk.length)

      try {
        value = JSON.parse(text)
      } catch {
        value = text
      }
      break
    }

    return (value ?? options?.fallback) as CookieValue<T>
  },
  set<T extends CookieName>(
    name: T,
    value: CookieValue<T>,
    options?: CookieOptions<Omit<CookieInit, 'name' | 'value'>>
  ) {
    const { prefix, ...params } = { ...COOKIE_OPTIONS, ...options }
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    const args = [`${prefixCookieName(name, prefix)}=${serializedValue}`]

    for (const [key, value] of Object.entries(params)) {
      if (!value) continue
      const name = key === 'maxAge' ? 'Max-Age' : key.charAt(0).toUpperCase() + key.slice(1)
      args.push(`${name}=${String(value)}`)
    }

    document.cookie = args.join('; ')
  },
  delete(names: CookieName | CookieName[], options?: CookieOptions) {
    for (const name of [names].flat()) {
      if (!this.has(name, options)) return
      document.cookie = `${prefixCookieName(name, options?.prefix)}=;`
    }
  },
  has(name: CookieName, options?: CookieOptions) {
    return document.cookie.split(';').some(key => key.trim().startsWith(`${prefixCookieName(name, options?.prefix)}=`))
  },
})
