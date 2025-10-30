import { notFound } from 'next/navigation'
import { use } from 'react'

import { getLocale } from 'next-intl/server'

import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseView } from '@/components/features/courses/course-view'
import { SuspenseLayout } from '@/components/layout/suspense-layout'
import { enrollUser, findCourse, getCurrentUser } from '@/lib/data/server'
import { localize } from '@/lib/intl'
import { createMetadata } from '@/lib/metadata'
import { CourseMode } from '@/lib/navigation'

const createPageData = async ({ params }: PageProps<'/courses/[slug]'>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const user = await getCurrentUser()
  const course = await findCourse(slug)
  if (!(course && user)) return notFound()

  return { course, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await createPageData(props)
  if (!(course && user)) return createMetadata()

  const locale = await getLocale()

  return createMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

const resolveCoursePageContent = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await createPageData(props)
  const locale = await getLocale()

  if (user.isLearner && !course.enrolled) {
    await enrollUser(course.id, locale)
  }

  const defaultMode = user.canEdit ? CourseMode.Editor : CourseMode.Student

  return { course, defaultMode }
}

const CoursePageContent = (props: PageProps<'/courses/[slug]'>) => {
  const { course, defaultMode } = use(resolveCoursePageContent(props))

  return (
    <RichTextEditorProvider>
      <CourseView course={course} defaultMode={defaultMode} />
    </RichTextEditorProvider>
  )
}

export default (props: PageProps<'/courses/[slug]'>) => (
  <SuspenseLayout>
    <CoursePageContent {...props} />
  </SuspenseLayout>
)
