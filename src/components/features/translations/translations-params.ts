import { parseAsArrayOf, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { TRANSLATION_STATES } from '@/lib/translation-table'

export const translationsParsers = {
  filter: parseAsArrayOf(parseAsStringEnum([...TRANSLATION_STATES])).withDefault([]),
  key: parseAsString,
  namespace: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault(''),
}
