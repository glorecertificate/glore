'use client'

import { createContext, type ProviderProps, useContext, useState } from 'react'

import { type User, type UserOrganization } from '@/db/types'

export const UserContext = createContext<{
  user: User
  setUser: React.Dispatch<React.SetStateAction<User>>
  organization: UserOrganization | null
  setOrganization: React.Dispatch<React.SetStateAction<UserOrganization | null>>
} | null>(null)

export type UserProviderProps = ProviderProps<{
  user: User
  organization: UserOrganization | null
}>

export const UserProvider = ({ value, ...props }: UserProviderProps) => {
  const [user, setUser] = useState(value.user)
  const [organization, setOrganization] = useState(value.organization)

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        organization,
        setOrganization,
      }}
      {...props}
    />
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
