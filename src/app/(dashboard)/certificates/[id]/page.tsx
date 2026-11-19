import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { loadCertificate, loadCertificateActivity } from '@/actions/certificates/detail-data'
import { loadOrgTutors } from '@/actions/organizations/panel-data'
import { getViewer } from '@/actions/viewer'
import { CertificateBand } from '@/components/features/certificates/certificate-band'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { VERIFY_ROOT } from '@/lib/constants'

const CertificatePageContent = async ({ params }: { params: PageProps<'/certificates/[id]'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const certificate = await loadCertificate(certificateId)
  if (!certificate) notFound()

  const [user, { data: tutors }, activity] = await Promise.all([
    getViewer(),
    loadOrgTutors(certificate.organizationId),
    loadCertificateActivity(certificate.id),
  ])
  const canManage =
    user.isAdmin ||
    user.organizations.some(
      ({ id: orgId, role }) => orgId === certificate.organizationId && (role === 'admin' || role === 'representative')
    )

  const verifyUrl = certificate.code ? `${process.env.APP_URL}${VERIFY_ROOT}/${certificate.code}` : null
  const shareUrl =
    certificate.isDefault && certificate.userId === user.id && user.publicProfile && user.username
      ? `${process.env.APP_URL}/@${user.username}`
      : verifyUrl

  return (
    <CertificateDetail
      canManage={canManage}
      certificate={certificate}
      events={activity?.events ?? []}
      notes={activity?.review ?? null}
      tutors={tutors ?? undefined}
      shareUrl={shareUrl}
      verifyUrl={verifyUrl}
    />
  )
}

const CertificateBandLoader = async ({ params }: { params: PageProps<'/certificates/[id]'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()
  return <CertificateBand id={certificateId} />
}

const CertificatePage = ({ params }: PageProps<'/certificates/[id]'>) => (
  <DashboardPage
    overlap
    header={
      <Suspense
        fallback={
          <DashboardHeader parent="certificates" title={<PageTitle name="detailTitle" namespace="CertificateList" />} />
        }
      >
        <CertificateBandLoader params={params} />
      </Suspense>
    }
  >
    <CertificatePageContent params={params} />
  </DashboardPage>
)

export default CertificatePage
