import {
  getCertificateEligibility,
  listTutorCertificates,
  listUnassignedOrgCertificates,
  listUserCertificates,
} from '@/actions/certificates/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesPageContent = async () => {
  const user = await getCurrentUser()
  const isTutor = user.organizations.some(({ role }) => role === 'tutor')

  if (isTutor) {
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
