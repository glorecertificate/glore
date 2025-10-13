import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemesProviderProps } from 'next-themes'

export interface ThemeProviderProps<T extends string> extends NextThemesProviderProps {
  themes: T[]
}

export const ThemeProvider = <T extends string>(props: ThemeProviderProps<T>) => (
  <NextThemesProvider attribute="class" enableColorScheme enableSystem {...props} />
)
