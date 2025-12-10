export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<Theme, 'system'>

export type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>
