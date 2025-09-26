'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useMemo } from 'react'

import { type ResolvedTheme, type Theme } from '@repo/ui/types'

/**
 * Extends the hook from `next-themes` to provide type-safe access to the application themes.
 *
 * It provides the current theme, resolved theme, and methods to set the theme.
 * It also includes booleans for simplified checks of light and dark modes.
 */
export const useTheme = () => {
  const {
    resolvedTheme: resolvedNextTheme,
    setTheme: setNextTheme,
    theme: nextTheme,
    themes: nextThemes,
  } = useNextTheme()

  const setTheme = setNextTheme as React.Dispatch<React.SetStateAction<Theme>>
  const resolvedTheme = resolvedNextTheme as ResolvedTheme
  const theme = nextTheme as Theme
  const themes = nextThemes as Theme[]
  const isLightMode = useMemo(() => resolvedTheme === 'light', [resolvedTheme])
  const isDarkMode = useMemo(() => resolvedTheme === 'dark', [resolvedTheme])

  return {
    setTheme,
    resolvedTheme,
    theme,
    themes,
    isLightMode,
    isDarkMode,
  }
}
