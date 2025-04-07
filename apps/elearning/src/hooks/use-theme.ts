import { useTheme as useNextTheme } from 'next-themes'

import { type Theme } from '@/lib/theme'

export const useTheme = () => {
  const { resolvedTheme: resolvedNextTheme, setTheme: setNextTheme, theme: nextTheme, themes: nextThemes } = useNextTheme()

  const setTheme = setNextTheme as React.Dispatch<React.SetStateAction<Theme>>
  const resolvedTheme = resolvedNextTheme as Theme
  const theme = nextTheme as Theme
  const themes = nextThemes as Theme[]

  return {
    setTheme,
    resolvedTheme,
    theme,
    themes,
  }
}
