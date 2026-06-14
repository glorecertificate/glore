'use client'

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from 'next-themes'

import { Theme } from '@/lib/types'
import { keysOf } from '@/lib/utils'
import theme from '~/config/theme.json'

export const ThemeProvider = ({
  attribute = 'class',
  enableColorScheme = true,
  enableSystem = true,
  themes = keysOf(theme.modes),
  ...props
}: ThemeProviderProps & {
  themes?: Theme[]
}) => (
  <NextThemeProvider
    attribute={attribute}
    enableColorScheme={enableColorScheme}
    enableSystem={enableSystem}
    themes={themes}
    {...props}
  />
)
