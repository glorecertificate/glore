'use client'

import { useCallback, useContext, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { type Session } from '@/api/modules/auth/types'
import { type Course } from '@/api/modules/courses/types'
import { type UserOrganization } from '@/api/modules/organizations/types'
import { type CurrentUser } from '@/api/modules/users/types'
import { SessionContext } from '@/components/providers/session-provider'

export const useSession = () => {
  const context = useContext(SessionContext)!

  const [session, setSession] = useState<Session | null>(null)
  const [courses, setCourses] = useState<Course[]>(context.courses)
  const [organization, setOrganization] = useState<UserOrganization | undefined>(context.organization)
  const [user, setUser] = useState<CurrentUser>(context.user)

  const fetchSession = useCallback(async () => {
    setSession(await api.auth.getSession())
  }, [])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  if (!context) throw new Error('useSession must be used within a SessionProvider')

  return { session, courses, setCourses, organization, setOrganization, user, setUser }
}
