import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { AUDIT_CATEGORIES } from '@/db/queries/admin-audit'

export const adminAuditParsers = {
  category: parseAsArrayOf(parseAsStringEnum([...AUDIT_CATEGORIES])).withDefault([]),
  from: parseAsString,
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
  to: parseAsString,
}
