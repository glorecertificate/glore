'use server'

import 'server-only'

import { z } from 'zod'

import { setCookie } from '@/lib/cookie-store'
import { LOCALES, LOCALE_COOKIE } from '@/lib/i18n'

const localeSchema = z.enum(LOCALES)

export const setLocaleCookie = async (locale: string) => {
  const parsed = localeSchema.safeParse(locale)
  if (!parsed.success) return
  await setCookie(LOCALE_COOKIE, parsed.data, { prefix: false })
}
