import { type Enum } from '@repo/utils/types'

import { Env } from '@/lib/env'
import app from 'config/app.json'

import { type Asset, type Cookie, type CookieKeyOptions } from './types'

/**
 * Generates a URL for an asset based on the environment's storage.
 */
export const asset = (asset: Enum<Asset>) => `${Env.STORAGE_URL}/${asset}`

/**
 * Generates a cookie name based on the provided options or using the default prefix and separator.
 */
export const parseCookieKey = (cookie: Cookie, options?: CookieKeyOptions) => {
  const { prefix = app.cookiePrefix, separator = '.' } = options || {}
  return prefix ? `${prefix}${separator ?? ''}${cookie}` : cookie
}
