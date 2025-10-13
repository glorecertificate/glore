import { notFound } from 'next/navigation'

import { localize } from '@glore/i18n'

import { CourseView } from '@/components/features/courses/course-view'
import { getLocale } from '@/lib/i18n'
import { createAsyncMetadata } from '@/lib/metadata'
import { createApiClient, createCookieStore } from '@/lib/ssr'

const getPageData = async ({ params }: PageProps<'/courses/[slug]'>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return {}

  const api = await createApiClient()
  const user = await api.users.getCurrent()
  const course = await api.courses.find(slug)
  if (!(course && user)) return notFound()

  return { course, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await getPageData(props)
  if (!(course && user)) return createAsyncMetadata()

  const locale = await getLocale()

  return createAsyncMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await getPageData(props)
  if (!(course && user)) return notFound()

  const api = await createApiClient()
  const locale = await getLocale()
  const cookies = await createCookieStore()
  const tabs = await cookies.get('course-tab')

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id, locale)
  }

  return <CourseView course={course} defaultTab={tabs?.[course.slug]} />
}
