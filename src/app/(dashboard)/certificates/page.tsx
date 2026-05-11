import { Suspense } from 'react'

import {
  getCertificateEligibility,
  listTutorCertificates,
  listUnassignedOrgCertificates,
  listUserCertificates,
} from '@/actions/certificates/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

const CertificatesPageContent = async () => {
  const user = await getCurrentUser()
  const isTutor = user.organizations.some(o => o.role === 'tutor')

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
  <>
    <PageHeader namespace="Layout" titleKey="certificates" />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <CertificatesPageContent />
      </Suspense>
    </PageMain>
  </>
)

export default CertificatesPage
