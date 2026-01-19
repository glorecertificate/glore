import { notFound } from 'next/navigation'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { findCourse } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseBreadcrumb } from '@/components/features/courses/course-breadcrumb'
import { CourseProvider } from '@/components/features/courses/course-provider'
import { CourseView } from '@/components/features/courses/course-view'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { COURSE_LANGUAGE_PARAM, COURSE_STEP_PARAM } from '@/lib/constants'
import { i18n, localize } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  [COURSE_LANGUAGE_PARAM]: parseAsStringEnum(i18n.locales),
  [COURSE_STEP_PARAM]: parseAsInteger.withDefault(1),
})

const resolvePageData = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const { slug } = await params

  const course = await findCourse(slug)
  if (!course) return notFound()

  const { [COURSE_LANGUAGE_PARAM]: languageParam, [COURSE_STEP_PARAM]: stepParam } = await parse(searchParams)
  const language = languageParam ?? (await getLocale())

  const user = await getCurrentUser()

  let step = stepParam
  if (user.isLearner) {
    const max = course.lessons.findIndex(lesson => !lesson.completed)
    if (max !== -1 && step - 1 > max) {
      step = max + 1
    }
  }
  step = step > 0 && step <= course.lessons.length ? step : 1

  return { course, language, step, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, language, user } = await resolvePageData(props)
  if (!(course && user)) return

  return {
    title: localize(course.title, language),
    description: localize(course.description, language),
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
