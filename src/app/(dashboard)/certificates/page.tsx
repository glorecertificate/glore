import { getCertificateEligibility, listUserCertificates } from '@/actions/certificate'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

export default async () => {
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
