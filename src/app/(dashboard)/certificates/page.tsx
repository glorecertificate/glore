import { redirect } from 'next/navigation'

import {
  getCertificateEligibility,
  listOrganizationCertificates,
  listTutorCertificates,
  listUnassignedOrgCertificates,
  listUserCertificates,
} from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesPageContent = async () => {
  const [user, activeOrgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (user.isAdmin) redirect('/admin/certificates')
  const role = user.organizations.find(({ id }) => id === activeOrgId)?.role

  if (activeOrgId && (role === 'admin' || role === 'representative')) {
    const [{ data: certificates }, { data: tutors }] = await Promise.all([
      listOrganizationCertificates(activeOrgId),
      listOrgTutors(activeOrgId),
    ])
    return <OrganizationCertificates certificates={certificates ?? []} tutors={tutors ?? []} />
  }

  if (role === 'tutor') {
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      listTutorCertificates(),
      listUnassignedOrgCertificates(),
    ])
    return <TutorCertificatesContent assigned={assigned ?? []} unassigned={unassigned ?? []} />
  }

  const [{ data: certificates }, eligibility] = await Promise.all([listUserCertificates(), getCertificateEligibility()])
  return <CertificatesContent certificates={certificates ?? []} eligibility={eligibility} />
}

const CertificatesPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="certificates" />}>
    <CertificatesPageContent />
  </DashboardPage>
)

export default CertificatesPage
