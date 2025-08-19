'use client'

import { useCallback, useContext, useState } from 'react'

import { SessionContext } from '@/components/providers/session-provider'
import { type Course } from '@/lib/api/courses/types'
import { type CurrentUser, type UserOrganization } from '@/lib/api/users/types'

/**
 * Hook to access the session context.
 *
 * It provides the current session data and methods to manage the session.
 */
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')

  const [courses, setCourses] = useState<Course[]>(context.courses)
  const [user, setUser] = useState<CurrentUser>(context.user)
  const [organization, setOrganization] = useState<UserOrganization | undefined>(context.organization)

  const setCourse = useCallback(
    (course: Course) => {
      setCourses(courses => {
        const index = courses.findIndex(({ id }) => id === course.id)
        if (index === -1) return [...courses, course]
        courses[index] = course
        return courses
      })
    },
    [setCourses],
  )

  return {
    courses,
    setCourse,
    setCourses,
    user,
    setUser,
    organization,
    setOrganization,
  }
}
