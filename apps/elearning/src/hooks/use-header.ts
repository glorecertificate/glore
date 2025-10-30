'use client'

import { useContext, useEffect } from 'react'

import { HeaderContext } from '@/components/providers/header-provider'

/**
 * Hook to manage the application header content.
 */
export const useHeader = ({
  header,
  shadow = true,
}: {
  header?: React.JSX.Element
  /** @default true */
  shadow?: boolean
} = {}) => {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeader must be used within a HeaderProvider')

  const { setBreadcrumb, setShadow, ...props } = context

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    if (header) setBreadcrumb(header)
    if (shadow !== undefined) setShadow(shadow)

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
