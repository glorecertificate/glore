import { redirect } from 'next/navigation'

import { getCertificateEligibility, listUserCertificates } from '@/actions/certificates/queries'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { CertificateForm } from '@/components/features/certificates/new/certificate-form'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesNewContent = async () => {
  const { eligible } = await getCertificateEligibility()
  if (!eligible) redirect('/certificates')

  const [activeOrgId, { data: certificates }] = await Promise.all([getActiveOrgId(), listUserCertificates()])
  if (certificates?.find(({ organization }) => organization?.id === activeOrgId)) redirect('/certificates')

  const [user, { data: courses }] = await Promise.all([getCurrentUser(), listCourses()])
  const activeOrg = user.organizations.find(o => o.id === activeOrgId) ?? user.organizations[0]
  const completedSkillCourses = (courses ?? []).filter(c => c.type === 'skill' && c.completed)

  return (
    <CertificateForm
      completedSkillCourses={completedSkillCourses}
      orgLogoUrl={activeOrg?.avatarUrl ?? undefined}
      orgName={activeOrg?.name ?? ''}
      user={user}
    />
  )
}

const CertificatesNewPage = () => (
  <DashboardPage title={<PageTitle namespace="Certificates" name="requestCertificateTitle" />}>
    <CertificatesNewContent />
  </DashboardPage>
)

export default CertificatesNewPage
