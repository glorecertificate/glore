export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<Theme, 'system'>

export type Icon<T = {}> = (props: React.SVGProps<SVGSVGElement> & T) => React.ReactNode

export type Rgb = [number, number, number]

export type Any = any
export type AnyRecord = Record<string | number | symbol, any>
export type AnyFunction = (...args: any[]) => any

export type Enum<T extends string> = T | `${T}`

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type HttpUrl = `http://${string}` | `https://${string}`

export type Replace<S extends string, From extends string, To extends string = ''> = From extends ''
  ? S
  : S extends `${infer A}${From}${infer B}`
    ? `${A}${To}${B}`
    : never
