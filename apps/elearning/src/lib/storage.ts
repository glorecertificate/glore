import { type User } from '@/api/users'
import { Env } from '@/lib/env'

/**
 * Local public assets.
 */
export enum Asset {
  EmailSent = '/email-sent.svg',
  Error = '/500.svg',
  Logo = '/logo.svg',
  Favicon = '/favicon.ico',
  Manifest = '/manifest.webmanifest',
  NotFound = '/404.svg',
  PasswordForgot = '/password-forgot.svg',
  Placeholder = '/placeholder.svg',
}

/**
 * Returns the URL of a remote public asset.
 */
export const asset = (path: string) => `${Env.STORAGE_URL}/${path}`

/**
 * Application cookie names.
 */
export enum Cookie {
  Locale = 'NEXT_LOCALE',
  SidebarOpen = 'GLORE_SIDEBAR_OPEN',
  CurrentOrg = 'GLORE_CURRENT_ORG',
}

/**
 * Sets a cookie with the given name, value and options.
 */
export const setCookie = (
  cookie: Cookie,
  value: string | number | boolean,
  options = {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  },
) => {
  document.cookie = `${cookie}=${value}; path=${options.path}; max-age=${options.maxAge}`
}

/**
 * Gets the value of the cookie with the given name.
 */
export const getCookie = (cookie: Cookie) => {
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
  return ''
}

/**
 * Application local storage keys.
 */
export enum LocalStorageItem {
  User = 'user',
}

/**
 * Application local storage.
 */
export interface LocalStorage {
  [LocalStorageItem.User]: User
}
