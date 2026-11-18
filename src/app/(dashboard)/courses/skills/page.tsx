import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findSkillFramework } from '@/actions/courses/data'
import { getViewerContext } from '@/actions/viewer'
import { SkillFramework } from '@/components/features/courses/skill-framework'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

export const generateMetadata = async () => {
  const t = await getTranslations('Learning.framework')
  return { title: t('title') }
}

const SkillsPageContent = async () => {
  const { user } = await getViewerContext()
  if (!user.canEdit) return notFound()

  const { groups, ungrouped } = await findSkillFramework()

  return <SkillFramework groups={groups} ungrouped={ungrouped} />
}

const SkillsPage = () => (
  <DashboardPage parent="courses" title={<PageTitle namespace="Learning.framework" name="title" />} width="content">
    <SkillsPageContent />
  </DashboardPage>
)

export default SkillsPage
