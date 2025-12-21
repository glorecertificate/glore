import type { Locale } from 'next-intl'

import type { Enum } from '@glore/utils/types'

import type { CourseListView } from '@/components/features/courses/course-list'
import type { Course } from '@/db/queries'
import type { Theme } from '@/lib/types'

export type RequestCookies = Awaited<ReturnType<typeof import('next/headers').cookies>>

export interface Cookies {
  course_list_groups: string[]
  course_list_language_filter: Locale[]
  course_list_tab: CourseListView
  courses_language: Record<Course['slug'], Locale>
  email: string
  login_user: string
  org: number
  sidebar_open: boolean
  sidebar_width: string
  theme: Theme
}

export enum PublicAsset {
  Robots = 'robots.txt',
  Favicon = 'favicon.ico',
  Favicon96 = 'favicon-96x96.png',
  AppleIcon = 'apple-icon.png',
  WebAppIcon192 = 'web-app-icon-192x192.png',
  WebAppIcon512 = 'web-app-icon-512x512.png',
  WebAppScreenshotNarrow = 'web-app-screenshot-narrow.png',
  WebAppScreenshotWide = 'web-app-screenshot-wide.png',
  OpenGraph = 'open-graph.png',
}

export enum StorageAsset {
  EmailLogo = 'email/logo.png',
}

export const publicAsset = (path: Enum<PublicAsset>) => `/${path}`

export const storageAsset = (path: Enum<StorageAsset>) => `${process.env.STORAGE_URL}/${path}`
