import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type theme from '@config/theme'

import { type Cookies } from './config'

/**
 * Cookie name based on the `Cookies` interface.
 */
export type Cookie = keyof Cookies

/**
 * Options for cookie names.
 */
export interface CookieKeyOptions {
  prefix?: boolean | string
}

/**
 * Options for setting cookies.
 */
export interface CookieOptions extends Partial<ResponseCookie>, CookieKeyOptions {}

/**
 * Application local storage.
 */
export interface LocalStorage {
  theme: keyof typeof theme.modes
}

/**
 * Local storage keys used in the application.
 */
export type LocalStorageKey = keyof LocalStorage

/**
 * Local storage values based on the `LocalStorage` interface.
 */
export type LocalStorageValue<T extends LocalStorageKey> = LocalStorage[T]
