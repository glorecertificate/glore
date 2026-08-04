import { notFound } from 'next/navigation'

import { findCertificate } from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatePageContent = async ({ params }: { params: PageProps<'/certificates/[id]'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const [user, { data: certificate }] = await Promise.all([getCurrentUser(), findCertificate(certificateId)])
  if (!certificate) notFound()

  const isOwner = certificate.userId === user.id
  const isAssignedReviewer = certificate.reviewerId === user.id
  const isOrgManager = user.organizations.some(
    ({ id: orgId, role }) => orgId === certificate.organizationId && (role === 'admin' || role === 'representative')
  )

  if (!isOwner && !isAssignedReviewer && !isOrgManager) notFound()

  const { data: tutors } = await listOrgTutors(certificate.organizationId)

  return <CertificateDetail certificate={certificate} tutors={tutors ?? undefined} />
}

const CertificatePage = ({ params }: PageProps<'/certificates/[id]'>) => (
  <DashboardPage title={<PageTitle namespace="Certificates" name="backTo" />} backHref="/certificates">
    <CertificatePageContent params={params} />
  </DashboardPage>
)

export default CertificatePage
