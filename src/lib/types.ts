import { type Route } from 'next'

import { type LucideProps } from 'lucide-react'
import { type IconName } from 'lucide-react/dynamic'

import { type AUTH_VIEWS } from '@/lib/constants'
import type theme from '~/config/theme.json'

/*
  Overrides
*/
declare module 'next/navigation' {
  function usePathname(): Route
}

/*
  Utilities
*/
export type Any = any
export type AnyRecord = Record<string | number | symbol, any>
export type AnyFunction = (...args: any[]) => any
export type Enum<T extends string> = T | `${T}`
export type HttpUrl = `http://${string}` | `https://${string}`
export type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<CamelCase<U>>}`
  : S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S

/*
  Theme
*/
export type Theme = keyof typeof theme.modes
export type ResolvedTheme = Exclude<Theme, 'system'>
export type Icon<T = {}> = (props: IconProps<T>) => React.ReactNode
export type IconProps<T = {}> = React.ComponentProps<'svg'> & LucideProps & T
export type { IconName }
export type Rgb = [number, number, number]

/*
  App
*/
export type AuthView = (typeof AUTH_VIEWS)[number]
