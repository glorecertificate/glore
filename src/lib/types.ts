import { type LucideProps } from 'lucide-react'
import { type IconName } from 'lucide-react/dynamic'

export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<Theme, 'system'>

export type Icon<T = {}> = (props: IconProps<T>) => React.ReactNode
export type IconProps<T = {}> = React.ComponentProps<'svg'> & LucideProps & T
export type { IconName }

export type Rgb = [number, number, number]

export type Any = any
export type AnyRecord = Record<string | number | symbol, any>
export type AnyFunction = (...args: any[]) => any

export type Enum<T extends string> = T | `${T}`

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Replace<S extends string, From extends string, To extends string = ''> = From extends ''
  ? S
  : S extends `${infer A}${From}${infer B}`
    ? `${A}${To}${B}`
    : never

export type HttpUrl = `http://${string}` | `https://${string}`
