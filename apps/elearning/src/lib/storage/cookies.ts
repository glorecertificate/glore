import { type Locale } from 'next-intl'

import meta from '@config/metadata'
import { defineCookies } from '@glore/utils/cookies'

import { type Course, type User } from '@/lib/data'
import { type CourseListView } from '@/lib/navigation'
import { type Theme } from '@/lib/theme'

export interface Cookies {
  course_list_groups: string[]
  course_list_locales: Locale[]
  course_list_view: CourseListView
  course_locale: Record<Course['slug'], Locale>
  course_reset: boolean
  email: string
  login_user: string
  NEXT_LOCALE: Locale
  org: number
  sidebar_open: boolean
  sidebar_width: string
  theme: Theme
  user: User
}

export type Cookie = keyof Cookies

export const cookieStore = defineCookies<Cookies>({
  expires: 60 * 60 * 24 * 30,
  prefix: `${meta.slug}_`,
  resets: ['course_list_locales', 'course_list_view'],
})
