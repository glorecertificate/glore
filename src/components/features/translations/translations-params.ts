import { parseAsString, parseAsStringEnum } from 'nuqs/server'

import { TRANSLATION_STATES } from '@/lib/translation-table'

export const translationsParsers = {
  filter: parseAsStringEnum([...TRANSLATION_STATES]),
  key: parseAsString,
  namespace: parseAsString,
  q: parseAsString.withDefault(''),
}
