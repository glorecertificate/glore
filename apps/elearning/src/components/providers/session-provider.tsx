'use client'

import { createContext } from 'react'

import { type Course } from '@/api/modules/courses/types'
import { type UserOrganization } from '@/api/modules/organizations/types'
import { type CurrentUser } from '@/api/modules/users/types'

export interface SessionContext {
  courses: Course[]
  user: CurrentUser
  organization?: UserOrganization
}

export const SessionContext = createContext<SessionContext | null>(null)

export const SessionProvider = (props: React.PropsWithChildren<SessionContext>) => (
  <SessionContext.Provider value={props} {...props} />
)
