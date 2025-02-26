'use client'

import { useCallback } from 'react'

import { useTheme as useNextTheme } from 'next-themes'

import { type Theme } from '@/lib/theme'

export const useTheme = () => {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme()

  const setTheme = useCallback(
    (theme: Theme) => {
      setNextTheme(theme)
    },
    [setNextTheme],
  )

  return {
    theme: resolvedTheme as Theme,
    setTheme,
  }
}
