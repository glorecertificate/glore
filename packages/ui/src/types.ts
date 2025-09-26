/**
 * Available theme modes.
 */
export type Theme = 'system' | 'light' | 'dark'

/**
 * Resolved theme modes (excluding 'system').
 */
export type ResolvedTheme = Exclude<Theme, 'system'>

/**
 * Icon component definition.
 */
export type Icon<T = {}> = (props: IconProps<T>) => React.ReactNode

/**
 * Icon component properties.
 */
export type IconProps<T = {}> = T extends never ? React.SVGProps<SVGSVGElement> : React.SVGProps<SVGSVGElement> & T
