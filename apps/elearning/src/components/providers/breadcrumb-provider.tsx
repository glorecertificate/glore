'use client'

import { createContext, useState } from 'react'

interface BreadcrumbContext {
  breadcrumb?: React.JSX.Element
  setBreadcrumb: (breadcrumb?: React.JSX.Element) => void
}

export const BreadcrumbContext = createContext<BreadcrumbContext | null>(null)

export const BreadcrumbProvider = (props: React.PropsWithChildren) => {
  const [breadcrumb, setBreadcrumb] = useState<React.JSX.Element | undefined>(undefined)
  return <BreadcrumbContext.Provider value={{ breadcrumb, setBreadcrumb }} {...props} />
}
