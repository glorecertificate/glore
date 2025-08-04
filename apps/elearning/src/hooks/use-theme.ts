import { useMemo } from 'react'

import { useTheme as useNextTheme } from 'next-themes'

import { type Theme } from '@/lib/theme'

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

  const setTheme = setNextTheme as React.Dispatch<React.SetStateAction<Theme | `${Theme}`>>
  const resolvedTheme = resolvedNextTheme as Omit<Theme, 'system'>
  const theme = nextTheme as Theme | `${Theme}`
  const themes = nextThemes as Array<Theme | `${Theme}`>
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
