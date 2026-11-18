import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findSkillFramework } from '@/actions/courses/data'
import { getLearningContext } from '@/actions/courses/learner'
import { SkillFramework } from '@/components/features/courses/skill-framework'
import { SkillFrameworkActions } from '@/components/features/courses/skill-framework/actions'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

export const generateMetadata = async () => {
  const t = await getTranslations('Learning.framework')
  return { title: t('title') }
}

const SkillsPageContent = async () => {
  const { user } = await getLearningContext()
  if (!user.canEdit) return notFound()

  const { groups, ungrouped } = await findSkillFramework()

  return <SkillFramework groups={groups} ungrouped={ungrouped} />
}

const SkillsPage = () => (
  <DashboardPage
    overlap
    actions={<SkillFrameworkActions />}
    description={<PageTitle namespace="Learning.framework" name="description" />}
    parent="courses"
    title={<PageTitle namespace="Learning.framework" name="title" />}
  >
    <SkillsPageContent />
  </DashboardPage>
)

export default SkillsPage
