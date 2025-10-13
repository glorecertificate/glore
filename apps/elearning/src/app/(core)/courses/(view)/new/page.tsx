import { notFound } from 'next/navigation'

import { CourseView } from '@/components/features/courses/course-view'
import { createMetadata } from '@/lib/metadata'
import { createApiClient } from '@/lib/server'

export const generateMetadata = createMetadata({
  title: 'Courses.newCourse',
})

export default async () => {
  const api = await createApiClient()
  const user = await api.users.getCurrent()

  if (!(user && (user.isAdmin || user.isEditor))) return notFound()

  return <CourseView />
}
