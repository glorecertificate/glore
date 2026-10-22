import { notFound } from 'next/navigation'

import { findCertificate, findCertificateActivity } from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { VERIFY_ROOT } from '@/lib/constants'

const CertificatePageContent = async ({ params }: { params: PageProps<'/certificates/[id]'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const { data: certificate } = await findCertificate(certificateId)
  if (!certificate) notFound()

  const [user, { data: tutors }, { data: activity }] = await Promise.all([
    getCurrentUser(),
    listOrgTutors(certificate.organizationId),
    findCertificateActivity(certificate.id),
  ])
  const canManage =
    user.isAdmin ||
    user.organizations.some(
      ({ id: orgId, role }) => orgId === certificate.organizationId && (role === 'admin' || role === 'representative')
    )

  return (
    <CertificateDetail
      canManage={canManage}
      certificate={certificate}
      events={activity?.events ?? []}
      notes={activity?.review ?? null}
      tutors={tutors ?? undefined}
      verifyUrl={certificate.code ? `${process.env.APP_URL}${VERIFY_ROOT}/${certificate.code}` : null}
    />
  )
}

const CertificatePage = ({ params }: PageProps<'/certificates/[id]'>) => (
  <DashboardPage title={<PageTitle namespace="Certificates" name="backTo" />} backHref="/certificates">
    <CertificatePageContent params={params} />
  </DashboardPage>
)

export default CertificatePage
