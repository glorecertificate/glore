import { cookieStore } from '@/lib/storage'

/**
 * Returns a store for managing cookies on the client side.
 */
export const useCookies = () => {
  const { config, ...cookies } = cookieStore
  return cookies
}
