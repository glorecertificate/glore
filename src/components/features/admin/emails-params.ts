import { parseAsString, parseAsStringEnum } from 'nuqs/server'

import { LOCALES } from '@/lib/i18n'

export const EMAIL_PREVIEW_CATEGORIES = ['learning', 'mandatory', 'organization', 'reminders'] as const

export const emailPreviewParsers = {
  category: parseAsStringEnum([...EMAIL_PREVIEW_CATEGORIES]),
  lang: parseAsStringEnum([...LOCALES]).withDefault('en'),
  template: parseAsString,
}
