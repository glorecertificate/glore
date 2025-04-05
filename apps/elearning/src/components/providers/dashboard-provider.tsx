'use client'

import { createContext } from 'react'

import { type Module, type User } from '@/services/db'

interface DashboardContext {
  modules: Module[]
  user: User
}

interface DashboardProviderProps extends React.PropsWithChildren {
  value: DashboardContext
}

export const DashboardContext = createContext<DashboardContext | null>(null)

export const DashboardProvider = (props: DashboardProviderProps) => <DashboardContext.Provider {...props} />
