import dynamic from 'next/dynamic'
import { notFound, redirect } from 'next/navigation'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { getCourse } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { CourseBreadcrumb } from '@/components/features/courses/editor/breadcrumb'
import { CourseProvider } from '@/components/features/courses/editor/context'
import { COURSE_PARAMS } from '@/components/features/courses/editor/params'
import { CourseView } from '@/components/features/courses/editor/view'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { i18n, localizeRecord } from '@/lib/i18n'

const RichTextEditorProvider = dynamic(() =>
  import('@/components/blocks/rich-text-editor/provider').then(m => ({ default: m.RichTextEditorProvider }))
)

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

  const user = await getCurrentUser()

  let step = stepParam
  if (!user.canEdit) {
    const max = course.lessons.findIndex(lesson => !lesson.completed)
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

    params.set(COURSE_PARAMS.STEP, step.toString())
    redirect(`/courses/${slug}?${params.toString()}`)
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
      <PageHeader href="/courses" namespace="Courses" titleKey="courses">
        <CourseBreadcrumb />
      </PageHeader>
      <PageMain>
        <RichTextEditorProvider readOnly={!user.canEdit}>
          <CourseView />
        </RichTextEditorProvider>
      </PageMain>
    </CourseProvider>
  )
}
