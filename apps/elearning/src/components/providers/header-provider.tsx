'use client'

import { createContext, useState } from 'react'

interface HeaderContext {
  breadcrumb?: React.JSX.Element
  setBreadcrumb: (breadcrumb?: React.JSX.Element) => void
  subHeader?: React.JSX.Element
  setSubHeader: (subHeader?: React.JSX.Element) => void
  headerShadow?: boolean
  setHeaderShadow: (value: boolean) => void
}

export const HeaderContext = createContext<HeaderContext | null>(null)

export const HeaderProvider = (props: React.PropsWithChildren) => {
  const [breadcrumb, setBreadcrumb] = useState<React.JSX.Element | undefined>(undefined)
  const [subHeader, setSubHeader] = useState<React.JSX.Element | undefined>(undefined)
  const [headerShadow, setHeaderShadow] = useState<boolean>(true)

  return (
    <HeaderContext.Provider
      value={{ breadcrumb, setBreadcrumb, subHeader, setSubHeader, headerShadow, setHeaderShadow }}
      {...props}
    />
  )
}
