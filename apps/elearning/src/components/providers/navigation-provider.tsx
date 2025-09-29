'use client'

import { usePathname } from 'next/navigation'
import { type AppRoutes } from 'next/types/routes'
import { createContext, useState } from 'react'

interface NavigationContext {
  pathname: AppRoutes
  setUiPathname: React.Dispatch<React.SetStateAction<AppRoutes>>
  uiPathname: AppRoutes
}

export const NavigationContext = createContext<NavigationContext | null>(null)

export const NavigationProvider = (props: React.PropsWithChildren) => {
  const pathname = usePathname() as AppRoutes
  const [uiPathname, setUiPathname] = useState(pathname)
  return <NavigationContext.Provider value={{ pathname, uiPathname, setUiPathname }} {...props} />
}
