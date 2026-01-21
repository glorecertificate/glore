'use client'

import { createContext, useContext, useState } from 'react'

import { type Course, type SkillGroup } from '@/db/schema/courses'
import { type User, type UserOrganization } from '@/db/schema/users'

export interface SessionContextValue {
  courses: Course[]
  organization?: UserOrganization
  setOrganization: (organization?: UserOrganization) => void
  skillGroups: SkillGroup[]
  user: User
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export const SessionProvider = ({
  children,
  value,
  ...props
}: React.ProviderProps<Omit<SessionContextValue, 'setOrganization'>>) => {
  const { organization: initialOrganization, ...values } = value
  const [organization, setOrganization] = useState(initialOrganization)

  return (
    <SessionContext.Provider value={{ ...values, organization, setOrganization }} {...props}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}
