import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server'

import { loadCourseOverview, loadSkillProgress } from '@/actions/courses/learner'
import { getViewerContext } from '@/actions/viewer'
import { COURSE_PARAMS } from '@/components/features/courses/course-editor/params'
import { CourseEditorView } from '@/components/features/courses/course-editor/view'
import { CourseOverviewView } from '@/components/features/courses/course-overview'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { DashboardPage } from '@/components/layout/dashboard-page'
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

const loadOverview = async (slug: string, searchParams: PageProps<'/courses/[slug]'>['searchParams']) => {
  const [{ [COURSE_PARAMS.LANGUAGE]: requested }, locale] = await Promise.all([parse(searchParams), getLocale()])
  return loadCourseOverview(slug, requested, locale)
}

const CourseTitle = async ({
  searchParams,
  slug,
}: Pick<PageProps<'/courses/[slug]'>, 'searchParams'> & { slug: string }) => {
  const data = await loadOverview(slug, searchParams)
  return data?.overview.title ?? null
}

const CourseOverviewContent = async ({
  searchParams,
  slug,
  userId,
}: Pick<PageProps<'/courses/[slug]'>, 'searchParams'> & { slug: string; userId: string }) => {
  const data = await loadOverview(slug, searchParams)
  if (!data) return notFound()

  const isSkillLearner = data.access === 'learner' && data.overview.type === 'skill'
  const completedSkills = isSkillLearner ? (await loadSkillProgress(userId)).completedCourseIds.length : null

  return <CourseOverviewView access={data.access} completedSkills={completedSkills} overview={data.overview} />
}

const CoursePageContent = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const [{ slug }, { user }] = await Promise.all([params, getViewerContext()])
  if (user.canEdit) return <CourseEditorView basePath={`/courses/${slug}`} searchParams={searchParams} slug={slug} />

  return (
    <DashboardPage parent="courses" title={<CourseTitle searchParams={searchParams} slug={slug} />} width="content">
      <CourseOverviewContent searchParams={searchParams} slug={slug} userId={user.id} />
    </DashboardPage>
  )
}

const CoursePage = (props: PageProps<'/courses/[slug]'>) => (
  <Suspense fallback={<DashboardLoading parent="courses" />}>
    <CoursePageContent {...props} />
  </Suspense>
)

export default CoursePage
