'use client'

import { createContext, useState } from 'react'

import { type Module } from '@/api/modules'
import { type User } from '@/api/users'

interface DashboardContext {
  modules: Module[]
  setModules: React.Dispatch<React.SetStateAction<Module[]>>
  user: User
  setUser: React.Dispatch<React.SetStateAction<User>>
}

export const DashboardContext = createContext<DashboardContext | null>(null)

interface DashboardProviderProps extends React.PropsWithChildren, Pick<DashboardContext, 'modules' | 'user'> {}

export const DashboardProvider = (props: DashboardProviderProps) => {
  const [user, setUser] = useState<User>(props.user)
  const [modules, setModules] = useState<Module[]>(props.modules)

  return <DashboardContext.Provider value={{ user, setUser, modules, setModules }} {...props} />
}
