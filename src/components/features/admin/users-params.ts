import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { BAN_FILTERS, PLATFORM_ROLES, USER_STATUSES } from '@/db/queries/admin-user'

export const adminUsersParsers = {
  banned: parseAsArrayOf(parseAsStringEnum([...BAN_FILTERS])).withDefault([]),
  org: parseAsInteger,
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
  role: parseAsArrayOf(parseAsStringEnum([...PLATFORM_ROLES])).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...USER_STATUSES])).withDefault([]),
}
