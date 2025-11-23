import { notFound } from 'next/navigation'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseProvider } from '@/components/features/courses/course-provider'
import { CourseView } from '@/components/features/courses/course-view'
import { enrollUser, findCourse, getCurrentUser } from '@/lib/data/server'
import { LOCALES, localize } from '@/lib/intl'
import { createIntlMetadata } from '@/lib/metadata'

const resolvePageData = async ({ params, searchParams }: PageProps<'/courses/[slug]'>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const user = await getCurrentUser()
  const course = await findCourse(slug)
  if (!(course && user)) return notFound()

  let step = course.lessons.length || 1
  if (user.isLearner) {
    const lastIndex = course.lessons.findIndex(lesson => !lesson.completed)
    if (lastIndex > -1) {
      step = lastIndex + 1
    }
  }

  const locale = await getLocale()
  const { lang } = await searchParams
  const language = typeof lang === 'string' && LOCALES.includes(lang as Locale) ? (lang as Locale) : locale

  return { course, language, locale, step, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, locale, user } = await resolvePageData(props)
  if (!(course && user)) return createIntlMetadata()

  return createIntlMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<'/courses/[slug]'>) => {
  const { course, language, locale, step, user } = await resolvePageData(props)

  if (user.isLearner && !course.enrolled) {
    await enrollUser(course.id, locale)
  }

  return (
    <RichTextEditorProvider readOnly={!user.canEdit}>
      <CourseProvider course={course} language={language} step={step}>
        <CourseView />
      </CourseProvider>
    </RichTextEditorProvider>
  )
}
