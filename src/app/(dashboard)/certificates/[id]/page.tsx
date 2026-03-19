import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { findCertificate } from '@/actions/certificate'
import { getCurrentUser } from '@/actions/user'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

const CertificateDetailContent = async ({ id }: { id: number }) => {
  const [user, { data: certificate }] = await Promise.all([getCurrentUser(), findCertificate(id)])
  if (!certificate) notFound()

  const isOwner = certificate.userId === user.id
  const isAssignedReviewer = certificate.reviewerId === user.id
  if (!isOwner && !isAssignedReviewer) notFound()

  return <CertificateDetail certificate={certificate} />
}

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = await params
  const certId = Number(id)
  if (!certId || Number.isNaN(certId)) notFound()

  return (
    <>
      <PageHeader href="/certificates" namespace="Certificates" titleKey="backTo" />
      <PageMain>
        <Suspense fallback={<LoadingFallback />}>
          <CertificateDetailContent id={certId} />
        </Suspense>
      </PageMain>
    </>
  )
}
