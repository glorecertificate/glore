'use client'

import { CourseListDialog } from '@/components/features/courses/course-list/dialog'
import { CourseListFrameworkLink } from '@/components/features/courses/course-list/framework-link'
import { useSession } from '@/components/providers/session'

export const CourseListActions = () => {
  const { user } = useSession()
  if (!user.canEdit) return null

  return (
    <>
      <CourseListFrameworkLink />
      <CourseListDialog />
    </>
  )
}
