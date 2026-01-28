'use client'

import { createContext, useMemo, useState } from 'react'

import { type User } from '@/db/queries/user'
import { useCookies } from '@/hooks/use-cookies'

export interface SessionContextValue {
  user: User
  organizationId?: number
}

const useSessionContext = (value: SessionContextValue) => {
  const cookies = useCookies()

  const [user, setUser] = useState(value.user)
  const [organizationId, setOrganizationId] = useState(value.organizationId)

  const organization = useMemo(
    () => user.organizations.find(({ id }) => id === organizationId) ?? null,
    [organizationId, user.organizations]
  )
  const role = organization?.role ?? null

  const setOrganization = (id: number) => {
    setOrganizationId(id)
    cookies.set('org', id)
  }

  return {
    user: useMemo(
      () => ({
        ...user,
        role,
        isLearner: role === 'learner',
        isTutor: role === 'tutor',
        isRepresentative: role === 'representative',
        isVolunteer: role === 'volunteer',
      }),
      [user, role]
    ),
    setUser,
    organization,
    setOrganization,
  }
}

export const SessionContext = createContext<ReturnType<typeof useSessionContext> | null>(null)

export const SessionContextProvider = ({ value, ...props }: React.ProviderProps<SessionContextValue>) => {
  const providerValue = useSessionContext(value)
  return <SessionContext.Provider value={providerValue} {...props} />
}
