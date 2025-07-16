import { notFound } from 'next/navigation'

import { getApi } from '@/api/client'
import { type Course } from '@/api/modules/courses/types'
import { type User } from '@/api/modules/users/types'
import { CourseFlow } from '@/components/features/course-flow'
import { getLocale } from '@/lib/i18n/server'
import { localizeJson } from '@/lib/i18n/utils'
import { pageMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'

const getCourse = async ({ params }: PageProps<Route.Course>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return notFound()

  const api = await getApi()

  const course = await api.courses.find(slug)
  if (!course) return notFound()

  return course
}

const canAccessCourse = (course: Course, user: User) => {
  const publishedLocales = course.publishedLocales ?? []
  return !user.isEditor && (!!course.archivedAt || publishedLocales.length === 0)
}

export const generateMetadata = async ({ params }: PageProps<Route.Course>) => {
  const api = await getApi()
  const course = await getCourse({ params })
  const locale = await getLocale()
  const user = api.users.current()

  if (!canAccessCourse(course, user)) return pageMetadata()

  return pageMetadata({
    title: localizeJson(course.title, locale),
    description: localizeJson(course.description, locale),
    translate: false,
  })
}

export default async ({ params }: PageProps<Route.Course>) => {
  const api = await getApi()
  const course = await getCourse({ params })
  const user = api.users.current()

  if (!canAccessCourse(course, user)) return notFound()

  if (user.isLearner && !course.enrolled) {
    await api.courses.enrollUser(course.id)
  }

  return <CourseFlow course={course} />
}
