import { notFound } from 'next/navigation'

import { findCertificate } from '@/actions/certificate'
import { getCurrentUser } from '@/actions/user'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = await params
  const certId = Number(id)
  if (!certId || Number.isNaN(certId)) notFound()

  const [user, { data: certificate }] = await Promise.all([getCurrentUser(), findCertificate(certId)])
  if (!certificate) notFound()

  const isOwner = certificate.userId === user.id
  const isAssignedReviewer = certificate.reviewerId === user.id
  if (!isOwner && !isAssignedReviewer) notFound()

  return (
    <>
      <PageHeader href="/certificates" namespace="Certificates" titleKey="backTo" />
      <PageMain>
        <CertificateDetail certificate={certificate} />
      </PageMain>
    </>
  )
}
