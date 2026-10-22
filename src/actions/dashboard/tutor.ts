import 'server-only'

import { listTutorCertificates, listUnassignedOrgCertificates } from '@/actions/certificates/queries'
import { buildTutorSummary } from '@/actions/dashboard/core'

export const loadTutorSummary = async (now: number) => {
  const [{ data: assigned }, { data: unassigned }] = await Promise.all([
    listTutorCertificates(),
    listUnassignedOrgCertificates(),
  ])
  return buildTutorSummary(assigned ?? [], unassigned ?? [], now)
}
