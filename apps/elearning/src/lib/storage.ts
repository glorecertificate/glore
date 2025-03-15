import { Env } from '@/lib/env'
import { type Profile } from '@/services/db'
import { type Locale } from '@/services/i18n'

export enum Cookie {
  Locale = 'NEXT_LOCALE',
  SidebarOpen = 'NEXT_SIDEBAR_OPEN',
}

export interface Cookies {
  [Cookie.Locale]: Locale
  [Cookie.SidebarOpen]: boolean
}

export enum LocalStorageItem {
  Profile = 'profile',
}

export interface LocalStorage {
  [LocalStorageItem.Profile]: Profile
}

export const asset = (path: string) => `${Env.SUPABASE_URL}/storage/v1/object/public/${path}`

export enum Asset {
  Logo = '/logo.svg',
  Glore = '/glore.png',
  GloreDark = '/glore-dark.png',
  Favicon = '/favicon.ico',
  Manifest = '/site.webmanifest',
  NotFound = '/404.svg',
}
