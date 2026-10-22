import { parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { ADMIN_CERTIFICATE_STATUSES } from '@/db/queries/admin-certificate'

export const adminCertificatesParsers = {
  org: parseAsInteger,
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
  status: parseAsStringEnum([...ADMIN_CERTIFICATE_STATUSES]),
}
