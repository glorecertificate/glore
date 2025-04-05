import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { Theme } from '@/lib/theme'

export const ThemeProvider = ({ children }: React.PropsWithChildren) => (
  <NextThemesProvider attribute="class" enableSystem themes={Object.values(Theme)}>
    {children}
  </NextThemesProvider>
)
