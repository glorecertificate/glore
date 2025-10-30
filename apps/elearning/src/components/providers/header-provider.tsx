'use client'

import { createContext, useState } from 'react'

interface HeaderContext {
  header?: React.JSX.Element
  setBreadcrumb: (breadcrumb?: React.JSX.Element) => void
  setShadow: (value: boolean) => void
  shadow?: boolean
}

export const HeaderContext = createContext<HeaderContext | null>(null)

export const HeaderProvider = (props: React.PropsWithChildren) => {
  const [header, setBreadcrumb] = useState<React.JSX.Element | undefined>(undefined)
  const [shadow, setShadow] = useState<boolean>(false)

  return <HeaderContext.Provider value={{ header, setBreadcrumb, shadow, setShadow }} {...props} />
}
