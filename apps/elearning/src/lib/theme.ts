export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<Theme, 'system'>
