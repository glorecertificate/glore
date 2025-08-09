import { notFound } from 'next/navigation'

import { CourseView } from '@/components/features/courses/course-view'
import { createApi } from '@/lib/api/server'
import { getLocale } from '@/lib/i18n/server'
import { localize } from '@/lib/i18n/utils'
import { intlMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'

const getPageData = async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return {}

  const api = await createApi()
  const course = await api.courses.find(slug)
  if (!course) return {}

  const user = await api.users.getCurrent()
  if (!user) return {}

  const publishedLocales = course.publishedLocales ?? []
  if (!user.isEditor && (!!course.archivedAt || publishedLocales.length === 0)) return {}

  return { course, user }
}

export const generateMetadata = async (props: PageProps<Route.Course>) => {
  const { course, user } = await getPageData(props)
  if (!course || !user) return intlMetadata()

  const locale = await getLocale()

  return intlMetadata({
    title: localize(course.title, locale),
    description: localize(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<Route.Course>) => {
  const { course, user } = await getPageData(props)
  if (!course || !user) return notFound()

  const api = await createApi()

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  return <CourseView course={course} />
}
