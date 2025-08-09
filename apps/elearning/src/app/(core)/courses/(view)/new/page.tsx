import { notFound } from 'next/navigation'

import { CourseView } from '@/components/features/courses/course-view'
import { createApi } from '@/lib/api/server'
import { createMetadata } from '@/lib/metadata'

export const generateMetadata = createMetadata({
  title: 'Courses.newCourse',
})

export default async () => {
  const api = await createApi()
  const user = await api.users.getCurrent()

  if (!user || (!user.isAdmin && !user.isEditor)) return notFound()

  return <CourseView />
}
