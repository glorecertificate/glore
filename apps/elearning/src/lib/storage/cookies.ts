import { type Locale } from 'next-intl'

import { type CookiesConfig, defineCookies } from '@glore/utils/cookies'

import { type Course, type User } from '@/lib/data'
import { type CourseListView, type CourseTab } from '@/lib/navigation'

export interface Cookies {
  'course-locale': Record<Course['slug'], Locale>
  'course-list-locales': Locale[]
  'course-list-view': CourseListView
  'course-tab': Record<Course['slug'], CourseTab>
  NEXT_LOCALE: Locale
  org: number
  'sidebar-open': boolean
  user: User
}

export type Cookie = keyof Cookies

export const COOKIES_CONFIG: CookiesConfig<Cookies> = {
  expires: 60 * 60 * 24 * 30,
  prefix: process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'glore.',
  resets: ['course-list-locales', 'course-list-view', 'course-tab'],
}

export const cookies = defineCookies<Cookies>(COOKIES_CONFIG)
