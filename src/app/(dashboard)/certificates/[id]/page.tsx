import { notFound } from 'next/navigation'

import { loadCertificate, loadCertificateActivity } from '@/actions/certificates/detail-data'
import { loadOrgTutors } from '@/actions/organizations/panel-data'
import { getViewer } from '@/actions/viewer'
import { CertificateDetail } from '@/components/features/certificates/certificate-detail'
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
  <DashboardPage parent="certificates" title={<PageTitle namespace="CertificateList" name="detailTitle" />}>
    <CertificatePageContent params={params} />
  </DashboardPage>
)

export default CertificatePage
