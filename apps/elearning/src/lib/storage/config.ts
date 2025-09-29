import { type Locale } from '@repo/i18n'

import { type CourseTab } from '@/hooks/use-course'
import { type Course, type User } from '@/lib/api'
import { type CourseListView } from '@/lib/navigation'

/**
 * Public assets paths.
 */
export enum Public {
  Robots = '/robots.txt',
  Manifest = '/api/manifest',
  Favicon = '/favicon.ico',
  Favicon96 = '/favicon-96x96.png',
  AppleIcon = '/apple-icon.png',
  WebAppIcon192 = '/web-app-icon-192x192.png',
  WebAppIcon512 = '/web-app-icon-512x512.png',
  WebAppScreenshotNarrow = '/web-app-screenshot-narrow.png',
  WebAppScreenshotWide = '/web-app-screenshot-wide.png',
  OpenGraph = '/open-graph.png',
}

/**
 * Remote assets file names.
 */
export enum Asset {
  Logo = 'logo.png',
  Trailer = 'trailer.mp4',
}

/**
 * Application cookies values.
 */
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

/**
 * Cookies that resets with a new user session.
 */
export const RESET_COOKIES = [
  'course-list-locales',
  'course-list-view',
  'course-tab',
] as const satisfies (keyof Cookies)[]
