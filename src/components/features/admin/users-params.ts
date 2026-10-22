import { parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { BAN_FILTERS, PLATFORM_ROLES, USER_STATUSES } from '@/db/queries/admin-user'

export const adminUsersParsers = {
  banned: parseAsStringEnum([...BAN_FILTERS]),
  org: parseAsInteger,
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
  role: parseAsStringEnum([...PLATFORM_ROLES]),
  status: parseAsStringEnum([...USER_STATUSES]),
}
