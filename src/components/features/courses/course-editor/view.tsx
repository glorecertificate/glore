import { notFound, redirect } from 'next/navigation'
import { ViewTransition } from 'react'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { getCookie } from '@/actions/cookies'
import { getCourse } from '@/actions/courses/queries'
import { getCurrentUser } from '@/actions/user'
import { CourseEditor } from '@/components/features/courses/course-editor'
import { CourseBreadcrumb } from '@/components/features/courses/course-editor/breadcrumb'
import { CourseProvider } from '@/components/features/courses/course-editor/context'
import { COURSE_PARAMS } from '@/components/features/courses/course-editor/params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LOCALES } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  [COURSE_PARAMS.LANGUAGE]: parseAsStringEnum(LOCALES),
  [COURSE_PARAMS.STEP]: parseAsInteger.withDefault(1),
})

const resolveEditorData = async ({
  basePath,
  searchParams,
  slug,
}: {
  basePath: `/courses/${string}`
  searchParams: Promise<Record<string, string | string[] | undefined>>
  slug: string
}) => {
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
    redirect(`${basePath}?${pageParams.toString()}`)
  }

  return { course, isViewer, language, step, user }
}

export const CourseEditorView = async (props: {
  basePath: `/courses/${string}`
  searchParams: Promise<Record<string, string | string[] | undefined>>
  slug: string
}) => {
  const { course, language, step } = await resolveEditorData(props)

  return (
    <CourseProvider value={{ course, language, step }}>
      <DashboardPage backHref="/courses" breadcrumb={<CourseBreadcrumb />}>
        <ViewTransition default="none" enter={{ 'course-created': 'grid-enter', default: 'none' }}>
          <CourseEditor />
        </ViewTransition>
      </DashboardPage>
    </CourseProvider>
  )
}
