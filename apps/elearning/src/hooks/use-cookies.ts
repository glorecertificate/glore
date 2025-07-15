import { useCallback } from 'react'

import { type Cookie } from '@/lib/storage'

/**
 * Hook to manage browser cookies.
 * Provides methods to set and read cookies.
 */
export const useCookies = () => {
  const setCookie = useCallback(
    (
      cookie: Cookie,
      value: string | number | boolean,
      options = {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
    ) => {
      document.cookie = `${cookie}=${value}; path=${options.path}; max-age=${options.maxAge}`
    },
    [],
  )

  const readCookie = useCallback((cookie: Cookie | `${Cookie}`) => {
    if (typeof window === 'undefined') return undefined

    const name = `${cookie}=`
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')

    for (const cookie of cookieArray) {
      let c = cookie
      while (c.startsWith(' ')) {
        c = c.substring(1)
      }
      if (c.startsWith(name)) {
        return c.substring(name.length, c.length)
      }
    }
    return undefined
  }, [])

  return { readCookie, setCookie } as const
}
