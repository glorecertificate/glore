'use client'

import { useContext, useEffect } from 'react'

import { HeaderContext } from '@/components/providers/header-provider'

/**
 * Hook to manage the application header content.
 */
export const useHeader = (
  breadcrumb?: React.JSX.Element | null,
  options = {
    shadow: true,
  }
) => {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeader must be used within a HeaderProvider')

  const { setBreadcrumb, setShadow, ...props } = context

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    if (breadcrumb) setBreadcrumb(breadcrumb)
    if (options.shadow !== undefined) setShadow(options.shadow)

    return () => {
      setBreadcrumb(undefined)
      setShadow(true)
    }
  }, [])

  return {
    ...props,
    setBreadcrumb,
    setShadow,
    hasShadow: props.shadow,
    showShadow: setShadow,
  }
}
