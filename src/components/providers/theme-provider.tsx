'use client'

import { ThemeProvider as Provider, type ThemeProviderProps as ProviderProps } from 'next-themes'

import theme from '@config/theme'
import { type Theme } from '@/lib/types'

export interface ThemeProviderProps extends ProviderProps {
  themes?: Theme[]
}

export const ThemeProvider = (props: ThemeProviderProps) => (
  <Provider attribute="class" enableColorScheme enableSystem themes={Object.keys(theme.modes)} {...props} />
)
