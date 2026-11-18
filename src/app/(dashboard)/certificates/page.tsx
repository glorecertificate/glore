import { redirect } from 'next/navigation'

import {
  loadCertificateEligibility,
  loadOrganizationCertificates,
  loadTutorCertificates,
  loadUnassignedCertificates,
  loadUserCertificates,
} from '@/actions/certificates/lists'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getViewerContext } from '@/actions/viewer'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesPageContent = async () => {
  const { orgId: activeOrgId, role, user } = await getViewerContext()
  if (user.isAdmin) redirect('/admin/certificates')

  if (activeOrgId && (role === 'admin' || role === 'representative')) {
    const [{ data: certificates }, { data: tutors }] = await Promise.all([
      loadOrganizationCertificates(activeOrgId),
      listOrgTutors(activeOrgId),
    ])
    return <OrganizationCertificates certificates={certificates ?? []} tutors={tutors ?? []} />
  }

  if (role === 'tutor') {
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      loadTutorCertificates(),
      loadUnassignedCertificates(),
    ])
    return <TutorCertificatesContent assigned={assigned ?? []} unassigned={unassigned ?? []} />
  }

  const [{ data: certificates }, eligibility] = await Promise.all([
    loadUserCertificates(),
    loadCertificateEligibility(),
  ])
  return <CertificatesContent certificates={certificates ?? []} eligibility={eligibility} />
}

const CertificatesPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="certificates" />}>
    <CertificatesPageContent />
  </DashboardPage>
)

export default CertificatesPage
