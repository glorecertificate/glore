'use client'

import { useCallback, useEffect } from 'react'

import { CourseList } from '@/components/features/course-list'
import { useSession } from '@/hooks/use-session'

// export const generateMetadata = generateAsyncMetadata({
//   title: 'Navigation.courses',
// })

export default () => {
  const { setCourses } = useSession()

  const updateCourses = useCallback(async () => {
    // const courses = await api.courses.list()
    // setCourses(courses)
  }, [setCourses])

  useEffect(() => {
    void updateCourses()
  }, [updateCourses])

  return <CourseList />
}
