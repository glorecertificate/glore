import 'server-only'

import { loadTutorCertificates, loadUnassignedCertificates } from '@/actions/certificates/lists'
import { buildTutorSummary } from '@/actions/dashboard/core'

export const loadTutorSummary = async (now: number) => {
  const [{ data: assigned }, { data: unassigned }] = await Promise.all([
    loadTutorCertificates(),
    loadUnassignedCertificates(),
  ])
  return buildTutorSummary(assigned ?? [], unassigned ?? [], now)
}
