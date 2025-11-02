'use client'

import { useTheme as useNextTheme } from 'next-themes'

import { useCookies } from '@/hooks/use-cookies'
import { type ResolvedTheme, type Theme } from '@/lib/theme'

/**
 * Extends the hook from `next-themes` to provide type-safe access to the application themes.
 *
 * It provides the current theme, resolved theme, and methods to set the theme.
 * It also includes booleans for simplified checks of light and dark modes.
 */
export const useTheme = () => {
  const cookies = useCookies()

  const {
    resolvedTheme: resolvedNextTheme,
    setTheme: setNextTheme,
    theme: nextTheme,
    themes: nextThemes,
  } = useNextTheme()

  const setTheme = (theme: Theme) => {
    setNextTheme(theme)
    cookies.set('theme', theme)
  }

  const theme = nextTheme as Theme
  const themes = nextThemes as Theme[]
  const resolvedTheme = resolvedNextTheme as ResolvedTheme
  const isLightMode = resolvedTheme === 'light'
  const isDarkMode = resolvedTheme === 'dark'

  return {
    setTheme,
    resolvedTheme,
    theme,
    themes,
    isLightMode,
    isDarkMode,
  }
}
