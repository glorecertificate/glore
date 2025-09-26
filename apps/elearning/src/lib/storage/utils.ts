import { type EnumValue } from '@repo/utils/types'

import { env } from '@/lib/env'

import { type Asset } from './config'
import { type Cookie, type CookieKeyOptions } from './types'

/**
 * Generates a URL for an asset based on the environment's storage.
 */
export const assetUrl = (asset: EnumValue<Asset>) => `${env.STORAGE_URL}/assets/${asset}`

/**
 * Generates a cookie name based on the provided options or using the default prefix and separator.
 */
export const parseCookieKey = (cookie: Cookie, options?: CookieKeyOptions) => {
  const { prefix = env.COOKIE_PREFIX } = options || {}
  return prefix ? `${prefix === true ? '' : prefix}${cookie}` : cookie
}
