'use client'

import { createContext } from 'react'

import { type Course } from '@/lib/api/courses/types'
import { type CurrentUser, type UserOrganization } from '@/lib/api/users/types'

export interface SessionContext {
  courses: Course[]
  organization?: UserOrganization
  user: CurrentUser
}

export const SessionContext = createContext<SessionContext | null>(null)

export const SessionProvider = ({ children, ...value }: React.PropsWithChildren<SessionContext>) => (
  <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
)
