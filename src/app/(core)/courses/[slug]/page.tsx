import { notFound, redirect } from 'next/navigation'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { getCourse } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseBreadcrumb } from '@/components/features/courses/course-breadcrumb'
import { CourseProvider } from '@/components/features/courses/course-context'
import { CourseView } from '@/components/features/courses/course-view'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { COURSE_LANGUAGE_PARAM, COURSE_STEP_PARAM } from '@/lib/constants'
import { i18n, localizeRecord } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  [COURSE_LANGUAGE_PARAM]: parseAsStringEnum(i18n.locales),
  [COURSE_STEP_PARAM]: parseAsInteger.withDefault(1),
})

const resolvePageData = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const { slug } = await params

  const course = await getCourse(slug)
  if (!course) return notFound()

  const resolvedSearchParams = await searchParams
  const { [COURSE_LANGUAGE_PARAM]: languageParam, [COURSE_STEP_PARAM]: stepParam } = await parse(resolvedSearchParams)
  const language = languageParam ?? (await getLocale())

  const user = await getCurrentUser()

  let step = stepParam
  if (!user.canEdit) {
    const max = course.lessons.findIndex(lesson => !lesson)
    if (max !== -1 && step - 1 > max) step = max + 1
  }
  step = step > 0 && step <= course.lessons.length ? step : 1

  if (stepParam !== step) {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          params.append(key, v)
        }
        continue
      }
      if (value) params.set(key, value)
    }

    params.set(COURSE_STEP_PARAM, step.toString())
    redirect('/courses/$slug?$newParams.toString()')
  }

  return { course, language, step, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, language, user } = await resolvePageData(props)
  if (!(course && user)) return

  return {
    title: localizeRecord(course.title, language),
    description: localizeRecord(course.description, language),
  }
}

export default async (props: PageProps<'/courses/[slug]'>) => {
  const { course, language, step, user } = await resolvePageData(props)

  return (
    <CourseProvider value={{ course, language, step }}>
      <RichTextEditorProvider readOnly={!user.canEdit}>
        <PageHeader>
          <CourseBreadcrumb />
        </PageHeader>
        <PageMain>
          <CourseView />
        </PageMain>
      </RichTextEditorProvider>
    </CourseProvider>
  )
}
