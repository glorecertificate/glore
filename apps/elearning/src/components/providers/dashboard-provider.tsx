'use client'

import { createContext } from 'react'

import { type BaseModule, type User } from '@/api'

interface DashboardContext {
  modules: BaseModule[]
  user: User
}

interface DashboardProviderProps extends React.PropsWithChildren {
  value: DashboardContext
}

export const DashboardContext = createContext<DashboardContext | null>(null)

export const DashboardProvider = (props: DashboardProviderProps) => <DashboardContext.Provider {...props} />
