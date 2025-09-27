import { notFound } from 'next/navigation'

import { localize } from '@repo/i18n'

import { CourseView } from '@/components/features/courses/course-view'
import { createApi } from '@/lib/api/ssr'
import { getLocale } from '@/lib/i18n'
import { createAsyncMetadata } from '@/lib/metadata'
import { getCookie } from '@/lib/storage/ssr'

const getPageData = async ({ params }: PageProps<'/courses/[slug]'>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return {}

  const { courses, users } = await createApi()
  const user = await users.getCurrent()
  const course = await courses.find(slug)
  if (!course || !user) return notFound()

  return { course, user }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await getPageData(props)
  if (!course || !user) return createAsyncMetadata()

  const locale = await getLocale()

  return createAsyncMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<'/courses/[slug]'>) => {
  const { course, user } = await getPageData(props)
  if (!course || !user) return notFound()

  const api = await createApi()

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  const tabs = await getCookie('course-tab')

  return <CourseView course={course} defaultTab={tabs?.[course.slug]} />
}
