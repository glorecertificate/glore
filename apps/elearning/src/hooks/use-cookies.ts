import { defineCookies } from '@glore/utils/cookies'

import { COOKIES_CONFIG, type Cookies } from '@/lib/storage'

/**
 * Returns a store for managing cookies on the client side.
 */
export const useCookies = () => defineCookies<Cookies>(COOKIES_CONFIG)
