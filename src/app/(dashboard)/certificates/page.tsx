import { getCertificateEligibility, listTutorCertificates, listUserCertificates } from '@/actions/certificate'
import { getCurrentUser } from '@/actions/user'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

export default async () => {
  const user = await getCurrentUser()
  const isTutor = user.organizations.some(o => o.role === 'tutor')

  if (isTutor) {
    const { data: certificates } = await listTutorCertificates()
    return (
      <>
        <PageHeader namespace="Layout" titleKey="certificates" />
        <PageMain>
          <TutorCertificatesContent certificates={certificates ?? []} />
        </PageMain>
      </>
    )
  }

  const [{ data: certificates }, eligibility] = await Promise.all([listUserCertificates(), getCertificateEligibility()])

  return (
    <>
      <PageHeader namespace="Layout" titleKey="certificates" />
      <PageMain>
        <CertificatesContent certificates={certificates ?? []} eligibility={eligibility} />
      </PageMain>
    </>
  )
}
