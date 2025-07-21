import { notFound } from 'next/navigation'

import { getApi } from '@/api/client'
import { CourseFlow } from '@/components/features/course-flow'
import { getLocale } from '@/lib/i18n/server'
import { localizeJson } from '@/lib/i18n/utils'
import { pageMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'

const getPageData = async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return {}

  const api = await getApi()
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
  if (!course || !user) return pageMetadata()

  const locale = await getLocale()

  return pageMetadata({
    title: localizeJson(course.title, locale),
    description: localizeJson(course.description, locale),
    translate: false,
  })
}

export default async (props: PageProps<Route.Course>) => {
  const { course, user } = await getPageData(props)
  if (!course || !user) return notFound()

  const api = await getApi()

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  return <CourseFlow course={course} />
}
