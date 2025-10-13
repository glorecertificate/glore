import type theme from '@config/theme'

import { type Locale } from '@glore/i18n'
import { type DefineCookiesOptions, defineCookies } from '@glore/utils/cookies'

import { type CourseTab } from '@/hooks/use-course'
import { type Course, type User } from '@/lib/api'
import { type CourseListView } from '@/lib/navigation'

export interface LocalStorage {
  theme: keyof typeof theme.modes
}

export type LocalStorageItem = keyof LocalStorage

export interface Cookies {
  'course-locale': Record<Course['slug'], Locale>
  'course-list-locales': Locale[]
  'course-list-view': CourseListView
  'course-tab': Record<Course['slug'], CourseTab>
  'login-token': string | null
  NEXT_LOCALE: Locale
  org: number
  'sidebar-open': boolean
  user: User
}

export type Cookie = keyof Cookies

export const COOKIE_OPTIONS = {
  expires: 60 * 60 * 24 * 30,
  prefix: process.env.COOKIE_PREFIX,
  resets: ['course-list-locales', 'course-list-view', 'course-tab'],
} as const satisfies DefineCookiesOptions<Cookies>

export const cookies = defineCookies<Cookies>(COOKIE_OPTIONS)
