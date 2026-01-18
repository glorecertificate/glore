import { type Locale } from 'next-intl'

import { type CourseListView } from '@/components/features/courses/course-list'
import { type Course } from '@/db/queries'
import { type Theme } from '@/lib/types'

export const COOKIE_PREFIX = process.env.COOKIE_PREFIX ?? ''

export const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const

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
export type CookieOptions = Omit<CookieInit, 'name' | 'value'>

export const parseCookieValue = <T extends CookieName>(value?: string | undefined, fallback?: CookieValue<T>) => {
  try {
    if (!value) throw Error()
    return JSON.parse(value)
  } catch {
    return (value ?? fallback) as CookieValue<T>
  }
}
