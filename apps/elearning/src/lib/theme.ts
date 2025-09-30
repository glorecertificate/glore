/**
 * Available application theme modes.
 */
export type Theme = 'system' | 'light' | 'dark'

/**
 * Resolved theme modes, excludes `system`.
 */
export type ResolvedTheme = Exclude<Theme, 'system'>
