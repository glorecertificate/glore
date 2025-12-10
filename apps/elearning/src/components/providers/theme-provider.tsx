'use client'

import * as NextTheme from 'next-themes'

import theme from '@config/theme'

import type { Theme } from '@/lib/types'

export interface ThemeProviderProps extends NextTheme.ThemeProviderProps {
  themes?: Theme[]
}

export const ThemeProvider = (props: ThemeProviderProps) => (
  <NextTheme.ThemeProvider
    attribute="class"
    enableColorScheme
    enableSystem
    themes={Object.keys(theme.modes)}
    {...props}
  />
)
