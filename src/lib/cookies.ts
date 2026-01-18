import { type Locale } from 'next-intl'

import { type CourseListView } from '@/components/features/courses/course-list'
import { type Course } from '@/db/queries'
import { type Theme } from '@/lib/types'

export const COOKIE_PREFIX = process.env.COOKIE_PREFIX ?? ''

export interface Cookies {
  courseListGroups: string[]
  courseListLanguage: Locale[]
  courseListTab: CourseListView
  courseLanguage: Record<Course['slug'], Locale>
  email: string
  loginUser: string
  org: number
  sidebarOpen: boolean
  sidebarWidth: string
  theme: Theme
}

export type CookieName = keyof Cookies
export type CookieValue<T> = T extends CookieName ? Cookies[T] | undefined : undefined

export const parseCookieValue = <T extends CookieName>(value?: string | undefined, fallback?: CookieValue<T>) => {
  try {
    if (!value) throw Error
    value = JSON.parse(value)
  } catch {
    value = fallback as string
  }
  return value as CookieValue<T>
}
