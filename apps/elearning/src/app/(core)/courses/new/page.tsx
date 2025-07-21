import { notFound } from 'next/navigation'

import { getApi } from '@/api/client'
import { CourseFlow } from '@/components/features/course-flow'
import { generatePageMetadata } from '@/lib/metadata'

export const generateMetadata = generatePageMetadata({
  title: 'Courses.newCourse',
})

export default async () => {
  const api = await getApi()
  const user = await api.users.getCurrent()

  if (!user || (!user.isAdmin && !user.isEditor)) return notFound()

  return <CourseFlow />
}
