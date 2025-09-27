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

  const { setHeader, setShadow, ...props } = context

  useEffect(() => {
    if (header) setHeader(header)
    if (shadow !== undefined) setShadow(shadow)

    return () => {
      setHeader(undefined)
      setShadow(true)
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return {
    ...props,
    setHeader,
    setShadow,
    hasShadow: props.shadow,
    showShadow: setShadow,
  }
}
