import { redirect } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { getCertificateEligibility, listUserCertificates } from '@/actions/certificates/queries'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { CertificateForm } from '@/components/features/certificates/new/certificate-form'
import { DashboardPage } from '@/components/layout/dashboard-page'

const CertificatesNewPage = async () => {
  const { eligible } = await getCertificateEligibility()
  if (!eligible) redirect('/certificates')

  const [activeOrgId, { data: certificates }] = await Promise.all([getActiveOrgId(), listUserCertificates()])
  if (certificates?.find(({ organization }) => organization?.id === activeOrgId)) redirect('/certificates')

  const [user, { data: courses }, t] = await Promise.all([
    getCurrentUser(),
    listCourses(),
    getTranslations('Certificates'),
  ])
  const activeOrg = user.organizations.find(o => o.id === activeOrgId) ?? user.organizations[0]
  const completedSkillCourses = (courses ?? []).filter(c => c.type === 'skill' && c.completed)

  return (
    <DashboardPage title={t('requestCertificateTitle')}>
      <CertificateForm
        completedSkillCourses={completedSkillCourses}
        orgLogoUrl={activeOrg?.avatarUrl ?? undefined}
        orgName={activeOrg?.name ?? ''}
        user={user}
      />
    </DashboardPage>
  )
}

export default CertificatesNewPage
