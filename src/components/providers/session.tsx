'use client'

import { createContext, use, useRef, useState } from 'react'

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

  const [userState, setUser] = useState(value.user)
  const [prev, setPrev] = useState(value.user)
  const [orgId, setOrgId] = useState(value.organizationId)

  if (value.user !== prev) {
    setPrev(value.user)
    setUser(value.user)
  }

  const organization = userState.organizations.find(({ id }) => id === orgId) ?? null
  const role = organization?.role ?? null

  const setOrganization = (id: number) => {
    setOrgId(id)
    cookiesRef.current.set('org', id)
  }

  const updateOrganization = (id: number, patch: Partial<User['organizations'][number]>) => {
    setUser(current => ({
      ...current,
      organizations: current.organizations.map(org => (org.id === id ? { ...org, ...patch } : org)),
      memberships: current.memberships.map(membership =>
        membership.organization.id === id
          ? {
              ...membership,
              ...(patch.role ? { role: patch.role } : {}),
              organization: {
                ...membership.organization,
                ...(patch.name ? { name: patch.name } : {}),
                ...('avatarUrl' in patch
                  ? { profile: { ...membership.organization.profile, avatarUrl: patch.avatarUrl ?? null } }
                  : {}),
              },
            }
          : membership
      ),
    }))
  }

  const user = {
    ...userState,
    isLearner: role === 'learner',
    isOrgAdmin: role === 'admin',
    isRepresentative: role === 'representative',
    isTutor: role === 'tutor',
    isVolunteer: role === 'volunteer',
    role,
  }

  return {
    user,
    setUser,
    organization,
    setOrganization,
    updateOrganization,
  }
}

const SessionContext = createContext<ReturnType<typeof useSessionContext> | null>(null)

export const SessionProvider = ({ children, ...props }: React.PropsWithChildren<SessionContextValue>) => {
  const value = useSessionContext(props)
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => {
  const context = use(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}
