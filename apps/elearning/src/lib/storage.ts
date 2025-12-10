import type { Locale } from 'next-intl'

import metadata from '@config/metadata'
import { type CookiesConfig, defineServerCookies } from '@glore/utils/cookies'

import type { Course, User } from '@/lib/db/schema'
import type { Theme } from '@/lib/types'

export interface Cookies {
  course_list_groups: string[]
  course_list_locales: Locale[]
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

export const cookiesConfig: CookiesConfig<Cookies> = {
  expires: 60 * 60 * 24 * 30,
  prefix: `${metadata.slug}_`,
  resets: ['course_list_locales'], // , 'course_list_view'],
}

export const getCookies = async () => {
  'use server'
  const { cookies } = await import('next/headers')
  return defineServerCookies<Cookies>(cookies, cookiesConfig)()
}
