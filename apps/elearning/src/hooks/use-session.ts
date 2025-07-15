'use client'

import { useContext, useState } from 'react'

import { type Course } from '@/api/modules/courses/types'
import { type CurrentUser, type UserOrganization } from '@/api/modules/users/types'
import { SessionContext } from '@/components/providers/session-provider'

/**
 * Hook to access the session context.
 * It provides the current session data and methods to manage the session.
 */
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')

  const [courses, setCourses] = useState<Course[]>(context.courses)
  const [user, setUser] = useState<CurrentUser>(context.user)
  const [organization, setOrganization] = useState<UserOrganization | undefined>(context.organization)

  return {
    courses,
    setCourses,
    user,
    setUser,
    organization,
    setOrganization,
  }
}
