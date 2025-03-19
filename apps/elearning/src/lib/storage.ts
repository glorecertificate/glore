import { Env } from '@/lib/env'
import { type User } from '@/services/db'
import { type Locale } from '@/services/i18n'

export enum Cookie {
  Locale = 'NEXT_LOCALE',
  SidebarOpen = 'GLORE_SIDEBAR_OPEN',
  CurrentOrg = 'GLORE_CURRENT_ORG',
}

export interface Cookies {
  [Cookie.CurrentOrg]: number
  [Cookie.Locale]: Locale
  [Cookie.SidebarOpen]: boolean
}

export enum LocalStorageItem {
  User = 'user',
}

export interface LocalStorage {
  [LocalStorageItem.User]: User
}

export const asset = (path: string) => `${Env.SUPABASE_URL}/storage/v1/object/public/${path}`

export enum Asset {
  Error = '/500.svg',
  Logo = '/logo.svg',
  Favicon = '/favicon.ico',
  Manifest = '/manifest.webmanifest',
  NotFound = '/404.svg',
  Placeholder = '/placeholder.svg',
}
