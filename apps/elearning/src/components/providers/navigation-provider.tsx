'use client'

import { createContext } from 'react'

import { type Route } from '@/lib/navigation'

interface NavigationContext {
  routes: Route[]
}

interface NavigationProviderProps extends React.PropsWithChildren {
  value: NavigationContext
}

export const NavigationContext = createContext<NavigationContext | null>(null)

export const NavigationProvider = (props: NavigationProviderProps) => <NavigationContext.Provider {...props} />
