import { ThemeProvider as NextThemesProvider } from 'next-themes'

import config from 'config/app.json'

export type Theme = keyof typeof config.themes

export const ThemeProvider = (props: React.PropsWithChildren) => (
  <NextThemesProvider attribute="class" enableSystem themes={Object.keys(config.themes)} {...props} />
)
