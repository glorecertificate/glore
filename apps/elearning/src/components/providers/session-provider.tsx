'use client'

import { createContext, useMemo, useState } from 'react'

import { type Course } from '@/api/modules/courses/types'
import { type UserOrganization } from '@/api/modules/organizations/types'
import { type CurrentUser } from '@/api/modules/users/types'

export interface SessionProviderProps {
  courses: Course[]
  organization?: UserOrganization
  user: CurrentUser
}

export interface SessionContext extends SessionProviderProps {
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  setOrganization: React.Dispatch<React.SetStateAction<UserOrganization | undefined>>
  setUser: React.Dispatch<React.SetStateAction<CurrentUser>>
}

export const SessionContext = createContext<SessionContext | null>(null)

export const SessionProvider = ({ children, ...props }: React.PropsWithChildren<SessionProviderProps>) => {
  const [courses, setCourses] = useState<Course[]>(props.courses)
  const [user, setUser] = useState<CurrentUser>(props.user)
  const [organization, setOrganization] = useState<UserOrganization | undefined>(props.organization)

  const value = useMemo(
    () => ({
      courses,
      setCourses,
      organization,
      setOrganization,
      user,
      setUser,
    }),
    [courses, organization, user],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
