import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findCertificate } from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'

const CertificatePageContent = async ({ id }: { id: number }) => {
  const [user, { data: certificate }] = await Promise.all([getCurrentUser(), findCertificate(id)])
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

const CertificatePage = async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const t = await getTranslations('Certificates')

  return (
    <DashboardPage title={t('backTo')} backHref="/certificates">
      <CertificatePageContent id={certificateId} />
    </DashboardPage>
  )
}

export default CertificatePage
