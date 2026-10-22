import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { findSkillFramework } from '@/actions/courses/data'
import { getLearningContext } from '@/actions/courses/learner'
import { SkillFramework } from '@/components/features/courses/skill-framework'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'

export const generateMetadata = async () => {
  const t = await getTranslations('Learning.framework')
  return { title: t('title') }
}

const SkillsPageContent = async () => {
  const { user } = await getLearningContext()
  if (!user.canEdit) return notFound()

  const { groups, ungrouped } = await findSkillFramework()

  return (
    <DashboardPage backHref="/courses" title={(await getTranslations('Learning.framework'))('title')}>
      <SkillFramework groups={groups} ungrouped={ungrouped} />
    </DashboardPage>
  )
}

const SkillsPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <SkillsPageContent />
  </Suspense>
)

export default SkillsPage
