import { notFound, redirect } from 'next/navigation'

import { getLocale, getTranslations } from 'next-intl/server'
import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { getCookie } from '@/actions/cookies'
import { enrollCourse } from '@/actions/courses/progress'
import { getCourse } from '@/actions/courses/queries'
import { getCurrentUser } from '@/actions/user'
import { CourseEditor } from '@/components/features/courses/course-editor'
import { CourseBreadcrumb } from '@/components/features/courses/course-editor/breadcrumb'
import { CourseProvider } from '@/components/features/courses/course-editor/context'
import { COURSE_PARAMS } from '@/components/features/courses/course-editor/params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { i18n, localizeRecord } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  [COURSE_PARAMS.LANGUAGE]: parseAsStringEnum(i18n.locales),
  [COURSE_PARAMS.STEP]: parseAsInteger.withDefault(1),
})

const resolvePageData = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const { slug } = await params

  const { data: course, error } = await getCourse(slug)
  if (error) return notFound()

  const resolvedSearchParams = await searchParams
  const { [COURSE_PARAMS.LANGUAGE]: languageParam, [COURSE_PARAMS.STEP]: stepParam } = await parse(resolvedSearchParams)
  const language = languageParam ?? (await getLocale())

  const [user, orgId] = await Promise.all([getCurrentUser(), getCookie('org')])
  const orgRole = user.organizations.find(({ id }) => id === orgId)?.role ?? null
  const isViewer = !user.canEdit && (orgRole === 'admin' || orgRole === 'representative' || orgRole === 'tutor')

  let step = stepParam
  if (!user.canEdit && !isViewer) {
    const max = course.lessons.findIndex(lesson => !lesson.completed)
    if (max !== -1 && step - 1 > max) step = max + 1
  }
  step = step > 0 && step <= course.lessons.length ? step : 1

  if (stepParam !== step) {
    const pageParams = new URLSearchParams()

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          pageParams.append(key, v)
        }
        continue
      }
      if (value) pageParams.set(key, value)
    }

    pageParams.set(COURSE_PARAMS.STEP, step.toString())
    redirect(`/courses/${slug}?${pageParams.toString()}`)
  }

  return { course, isViewer, language, step, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, language, user } = await resolvePageData(props)
  if (!(course && user)) return

  return {
    description: course.description ? localizeRecord(course.description, language) : undefined,
    title: localizeRecord(course.title, language),
  }
}

const CoursePage = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, isViewer, language, step, user } = await resolvePageData(props)

  if (!course.enrolled && !user.canEdit && !isViewer) {
    await enrollCourse(course.id, language)
  }

  const t = await getTranslations('Courses')

  return (
    <CourseProvider value={{ course, language, step }}>
      <DashboardPage title={t('courses')} backHref="/courses" breadcrumb={<CourseBreadcrumb />}>
        <CourseEditor />
      </DashboardPage>
    </CourseProvider>
  )
}

export default CoursePage
