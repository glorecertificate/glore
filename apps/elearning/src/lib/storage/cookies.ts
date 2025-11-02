import { type Locale } from 'next-intl'

import { defineCookies } from '@glore/utils/cookies'

import { type Course, type User } from '@/lib/data'
import { type CourseListView } from '@/lib/navigation'
import { type Theme } from '@/lib/theme'

export interface Cookies {
  course_list_groups: string[]
  course_list_locales: Locale[]
  course_list_view: CourseListView
  course_locale: Record<Course['slug'], Locale>
  email: string
  login_user: string
  NEXT_LOCALE: Locale
  org: number
  sidebar_open: boolean
  theme: Theme
  user: User
}

export type Cookie = keyof Cookies

export const cookieStore = defineCookies<Cookies>({
  expires: 60 * 60 * 24 * 30,
  prefix: process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'glore.',
  resets: ['course_list_locales', 'course_list_view'],
})
