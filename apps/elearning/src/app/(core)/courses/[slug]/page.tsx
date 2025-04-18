import { notFound } from 'next/navigation'

import { api } from '@/api/client'
import { CourseFlow } from '@/components/features/courses/course-flow'
import { getLocale } from '@/lib/i18n/server'
import { localizeJson } from '@/lib/i18n/utils'
import { generatePageMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'

export default async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const course = await api.courses.get(slug)
  if (!course) return notFound()

  if (!course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  return <CourseFlow courseId={course.id} />
}

export const generateMetadata = async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return await generatePageMetadata()

  const course = await api.courses.get(slug)
  if (!course) return await generatePageMetadata()

  const locale = await getLocale()

  return generatePageMetadata({
    title: localizeJson(course.title, locale),
    description: localizeJson(course.description, locale),
  })
}
