import { notFound } from 'next/navigation'

import { getLocale } from 'next-intl/server'
import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server'

import { findCourse } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseProvider } from '@/components/features/courses/course-provider'
import { CourseView } from '@/components/features/courses/course-view'
import { i18n, localize } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  lang: parseAsStringEnum(i18n.locales),
})

const resolvePageData = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const search = await parse(searchParams)
  const { slug } = await params

  const user = await getCurrentUser()
  const course = await findCourse(slug)
  if (!course) return notFound()

  let step = course.lessons.length || 1
  if (user.isLearner) {
    const lastIndex = course.lessons.findIndex(lesson => !lesson.completed)
    if (lastIndex > -1) {
      step = lastIndex + 1
    }
  }

  const language = search.lang || (await getLocale())

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
    <CourseProvider course={course} language={language} step={step}>
      <RichTextEditorProvider readOnly={!user.canEdit}>
        <CourseView />
      </RichTextEditorProvider>
    </CourseProvider>
  )
}
