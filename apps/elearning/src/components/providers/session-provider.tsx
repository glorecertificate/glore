'use client'

import { createContext, useState } from 'react'

import { type Course, type CurrentUser, type SkillGroup, type UserOrganization } from '@/lib/data'

export interface SessionContext {
  courses: Course[]
  organization?: UserOrganization
  skillGroups: SkillGroup[]
  user: CurrentUser
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  setUser: React.Dispatch<React.SetStateAction<CurrentUser>>
  setOrganization: React.Dispatch<React.SetStateAction<UserOrganization | undefined>>
  setSkillGroups: React.Dispatch<React.SetStateAction<SkillGroup[]>>
}

export const SessionContext = createContext<SessionContext | null>(null)

export type SessionProviderProps = React.PropsWithChildren<
  Pick<SessionContext, 'courses' | 'organization' | 'skillGroups' | 'user'>
>

export const SessionProvider = ({ children, ...context }: SessionProviderProps) => {
  const [courses, setCourses] = useState(context.courses)
  const [user, setUser] = useState(context.user)
  const [organization, setOrganization] = useState(context.organization)
  const [skillGroups, setSkillGroups] = useState(context.skillGroups ?? [])

  return (
    <SessionContext.Provider
      value={{
        courses,
        organization,
        skillGroups,
        user,
        setCourses,
        setUser,
        setOrganization,
        setSkillGroups,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
