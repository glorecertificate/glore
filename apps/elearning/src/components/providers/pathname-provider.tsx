'use client'

import { usePathname } from 'next/navigation'
import { createContext, useState } from 'react'

import { type Pathname } from '@/lib/navigation'

interface PathnameContext {
  pathname: Pathname
  setPathname: React.Dispatch<React.SetStateAction<Pathname>>
}

export const PathnameContext = createContext<PathnameContext | null>(null)

export const PathnameProvider = (props: React.PropsWithChildren) => {
  const nextPathname = usePathname()
  const [pathname, setPathname] = useState<Pathname>(nextPathname as Pathname)
  return <PathnameContext.Provider value={{ pathname, setPathname }} {...props} />
}
