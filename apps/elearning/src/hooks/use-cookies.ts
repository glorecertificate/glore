import { defineCookies } from '@glore/utils/cookies'

import { cookieOptions, type Cookies } from '@/lib/storage'

export const useCookies = () => defineCookies<Cookies>(cookieOptions)
