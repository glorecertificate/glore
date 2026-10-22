import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server'

import { getSkillProgress } from '@/actions/courses/data'
import { getLearningContext, loadCourseOverview } from '@/actions/courses/learner'
import { COURSE_PARAMS } from '@/components/features/courses/course-editor/params'
import { CourseEditorView } from '@/components/features/courses/course-editor/view'
import { CourseOverviewView } from '@/components/features/courses/course-overview'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { LOCALES } from '@/lib/i18n'

const { parse } = createSearchParamsCache({ [COURSE_PARAMS.LANGUAGE]: parseAsStringEnum(LOCALES) })

export const generateMetadata = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const [{ slug }, { [COURSE_PARAMS.LANGUAGE]: requested }, locale] = await Promise.all([
    params,
    parse(searchParams),
    getLocale(),
  ])
  const data = await loadCourseOverview(slug, requested, locale)
  if (!data) return
  return { description: data.overview.description ?? undefined, title: data.overview.title }
}

const CoursePageContent = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const [{ slug }, { user }] = await Promise.all([params, getLearningContext()])
  if (user.canEdit) return <CourseEditorView basePath={`/courses/${slug}`} searchParams={searchParams} slug={slug} />

  const [{ [COURSE_PARAMS.LANGUAGE]: requested }, locale] = await Promise.all([parse(searchParams), getLocale()])
  const data = await loadCourseOverview(slug, requested, locale)
  if (!data) return notFound()

  const isSkillLearner = data.access === 'learner' && data.overview.type === 'skill'
  const completedSkills = isSkillLearner ? (await getSkillProgress(user.id)).completedCourseIds.length : null

  return (
    <DashboardPage backHref="/courses" title={data.overview.title}>
      <CourseOverviewView access={data.access} completedSkills={completedSkills} overview={data.overview} />
    </DashboardPage>
  )
}

const CoursePage = (props: PageProps<'/courses/[slug]'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <CoursePageContent {...props} />
  </Suspense>
)

export default CoursePage
