import { notFound } from 'next/navigation'

import { getLocale } from 'next-intl/server'

import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseView } from '@/components/features/courses/course-view'
import { enrollUser, findCourse, getCurrentUser } from '@/lib/data/server'
import { localize } from '@/lib/intl'
import { createMetadata } from '@/lib/metadata'
import { CourseMode } from '@/lib/navigation'

const resolvePageData = async ({ params }: PageProps<'/courses/[slug]'>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const user = await getCurrentUser()
  const course = await findCourse(slug)
  if (!(course && user)) return notFound()

  return { course, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await resolvePageData(props)
  if (!(course && user)) return createMetadata()

  const locale = await getLocale()

  return createMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await resolvePageData(props)
  const locale = await getLocale()

  if (user.isLearner && !course.enrolled) {
    await enrollUser(course.id, locale)
  }

  const defaultMode = user.canEdit ? CourseMode.Editor : CourseMode.Student

  return (
    <RichTextEditorProvider>
      <CourseView course={course} defaultMode={defaultMode} />
    </RichTextEditorProvider>
  )
}
