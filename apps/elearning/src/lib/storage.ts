import { Env } from '@/lib/env'
import { type User } from '@/services/db'

export enum Cookie {
  Locale = 'NEXT_LOCALE',
  SidebarOpen = 'GLORE_SIDEBAR_OPEN',
  CurrentOrg = 'GLORE_CURRENT_ORG',
}

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

export enum LocalStorageItem {
  User = 'user',
}

export interface LocalStorage {
  [LocalStorageItem.User]: User
}

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

export const asset = (path: string) => `${Env.SUPABASE_URL}/storage/v1/object/public/${path}`
