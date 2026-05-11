import { redirect } from 'next/navigation'

import { getCertificateEligibility, listUserCertificates } from '@/actions/certificates/queries'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { CertificateForm } from '@/components/features/certificates/new/certificate-form'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'

const CertificatesNewPage = async () => {
  const [user, { data: certificates }, { eligible }, { data: courses }, activeOrgId] = await Promise.all([
    getCurrentUser(),
    listUserCertificates(),
    getCertificateEligibility(),
    listCourses(),
    getActiveOrgId(),
  ])

  if (!eligible) redirect('/certificates')

  const existingCertificate = certificates?.find(c => c.organization?.id === activeOrgId)
  if (existingCertificate) redirect('/certificates')

  const activeOrg = user.organizations.find(o => o.id === activeOrgId) ?? user.organizations[0]
  const completedSkillCourses = (courses ?? []).filter(c => c.type === 'skill' && c.completed)

  return (
    <>
      <PageHeader namespace="Certificates" titleKey="requestCertificateTitle" />
      <PageMain>
        <CertificateForm
          completedSkillCourses={completedSkillCourses}
          orgLogoUrl={activeOrg?.avatarUrl ?? undefined}
          orgName={activeOrg?.name ?? ''}
          user={user}
        />
      </PageMain>
    </>
  )
}

export default CertificatesNewPage
