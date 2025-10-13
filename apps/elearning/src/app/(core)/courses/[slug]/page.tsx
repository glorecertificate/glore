import { notFound } from 'next/navigation'
import { Suspense, use } from 'react'

import { getLocale } from 'next-intl/server'

import { CourseView } from '@/components/features/courses/course-view'
import { enrollUser, findCourse, getCurrentUser } from '@/lib/data/server'
import { localize } from '@/lib/intl'
import { createMetadata } from '@/lib/metadata'
import { serverCookies } from '@/lib/storage/server'

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
  const { get } = await serverCookies()
  const { course, user } = await createPageData(props)
  const locale = await getLocale()

  const tabs = get('course-tab')

  if (user.isLearner && !course.enrolled) {
    await enrollUser(course.id, locale)
  }

  return { course, defaultTab: tabs?.[course.slug] }
}

const CoursePageContent = (props: PageProps<'/courses/[slug]'>) => {
  const { course, defaultTab } = use(resolveCoursePageContent(props))

  return <CourseView course={course} defaultTab={defaultTab} />
}

export default (props: PageProps<'/courses/[slug]'>) => (
  <Suspense fallback={null}>
    <CoursePageContent {...props} />
  </Suspense>
)
