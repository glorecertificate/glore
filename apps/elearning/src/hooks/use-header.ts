'use client'

import { useContext, useEffect } from 'react'

import { HeaderContext } from '@/components/providers/header-provider'

/**
 * Hook to manage the application header content.
 */
export const useHeader = (options?: {
  header?: React.JSX.Element
  /** @default true */
  shadow?: boolean
}) => {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeader must be used within a HeaderProvider')

  const { setShadow, shadow, ...props } = context

  useEffect(() => {
    if (options?.header) props.setHeader(options.header)
    if (options?.shadow !== undefined) setShadow(options.shadow)

    return () => {
      props.setHeader(undefined)
      setShadow(true)
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return {
    ...props,
    hasShadow: shadow,
    showShadow: setShadow,
  }
}
