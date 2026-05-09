'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type User } from '@/db/queries/user'
import { useCookies } from '@/hooks/use-cookies'

interface SessionContextValue {
  user: User
  organizationId?: number
}

const useSessionContext = (value: SessionContextValue) => {
  const cookies = useCookies()
  const cookiesRef = useRef(cookies)
  cookiesRef.current = cookies

  const [user, setUser] = useState(value.user)
  const [organizationId, setOrganizationId] = useState(value.organizationId)

  useEffect(() => {
    setUser(value.user)
  }, [value.user])

  const organization = useMemo(
    () => user.organizations.find(({ id }) => id === organizationId) ?? null,
    [organizationId, user.organizations]
  )
  const role = organization?.role ?? null

  const setOrganization = useCallback((id: number) => {
    setOrganizationId(id)
    cookiesRef.current.set('org', id)
  }, [])

  const sessionUser = useMemo(
    () => ({
      ...user,
      isLearner: role === 'learner',
      isOrgAdmin: role === 'admin',
      isRepresentative: role === 'representative',
      isTutor: role === 'tutor',
      isVolunteer: role === 'volunteer',
      role,
    }),
    [user, role]
  )

  return useMemo(
    () => ({
      organization,
      setOrganization,
      setUser,
      user: sessionUser,
    }),
    [sessionUser, organization, setOrganization]
  )
}

export const SessionContext = createContext<ReturnType<typeof useSessionContext> | null>(null)

export const SessionContextProvider = ({ value, ...props }: React.ProviderProps<SessionContextValue>) => {
  const providerValue = useSessionContext(value)
  return <SessionContext.Provider value={providerValue} {...props} />
}
