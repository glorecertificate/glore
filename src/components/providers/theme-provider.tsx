'use client'

import { ThemeProvider as Provider, type ThemeProviderProps as ProviderProps } from 'next-themes'

import theme from '~/config/theme.json'

export type Theme = keyof typeof theme.modes
export type ResolvedTheme = Exclude<Theme, 'system'>

export const ThemeProvider = (
  props: ProviderProps & {
    themes?: Theme[]
  }
) => <Provider attribute="class" enableColorScheme enableSystem themes={Object.keys(theme.modes)} {...props} />
