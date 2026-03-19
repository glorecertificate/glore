import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { findCertificate } from '@/actions/certificate'
import { listOrgTutors } from '@/actions/organization'
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
  const isOrgManager = user.organizations.some(
    o => o.id === certificate.organizationId && (o.role === 'admin' || o.role === 'representative')
  )

  if (!isOwner && !isAssignedReviewer && !isOrgManager) notFound()

  const { data: tutors } = isOrgManager ? await listOrgTutors(certificate.organizationId) : { data: null }

  return <CertificateDetail certificate={certificate} tutors={tutors ?? undefined} />
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
