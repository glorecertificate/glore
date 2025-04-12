'use client'

import { createContext, useState } from 'react'

interface HeaderContext {
  breadcrumb?: React.JSX.Element
  subHeader?: React.JSX.Element
  setBreadcrumb: (breadcrumb?: React.JSX.Element) => void
  setSubHeader: (subHeader?: React.JSX.Element) => void
  hasShadow: boolean
  setHasShadow: (hasShadow: boolean) => void
}

export const HeaderContext = createContext<HeaderContext | null>(null)

export const HeaderProvider = (props: React.PropsWithChildren) => {
  const [breadcrumb, setBreadcrumb] = useState<React.JSX.Element | undefined>(undefined)
  const [subHeader, setSubHeader] = useState<React.JSX.Element | undefined>(undefined)
  const [hasShadow, setHasShadow] = useState(true)

  return (
    <HeaderContext.Provider value={{ breadcrumb, setBreadcrumb, subHeader, setSubHeader, hasShadow, setHasShadow }} {...props} />
  )
}
