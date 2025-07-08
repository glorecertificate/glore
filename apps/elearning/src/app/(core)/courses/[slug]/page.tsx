import { notFound } from 'next/navigation'

import { getApi } from '@/api/client'
import { CourseFlow } from '@/components/features/course-flow'
import { getLocale } from '@/lib/i18n/server'
import { localizeJson } from '@/lib/i18n/utils'
import { generatePageMetadata, pageMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'

export default async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const api = await getApi()

  const course = await api.courses.get(slug)
  if (!course) return notFound()

  const user = await api.users.getCurrent()

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  return <CourseFlow course={course} />
}

export const generateMetadata = async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return generatePageMetadata()

  const api = await getApi()

  const course = await api.courses.get(slug)
  if (!course) return generatePageMetadata()

  const locale = await getLocale()

  return pageMetadata({
    title: localizeJson(course.title, locale),
    description: localizeJson(course.description, locale),
    translate: false,
  })
}
