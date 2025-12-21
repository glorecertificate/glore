/**
 * Utility to use the `any` when needed and avoid linter warnings.
 */
export type Any = any

/**
 * Any object type with string keys.
 */
export type AnyRecord = Record<string | number | symbol, any>

/**
 * Any callable function type.
 */
export type AnyFunction = (...args: any[]) => any

/**
 * Primitive type.
 */
export type Primitive = string | number | bigint | boolean | null | undefined

/**
 * Enum type with stringified values
 */
export type Enum<T extends string> = T | `${T}`

/**
 * Email type.
 */
export type Email = `${string}@${string}.${string}`

/**
 * HTTP URL type.
 */
export type HttpUrl = `http://${string}` | `https://${string}`

/**
 * RGB color type.
 */
export type Rgb = [number, number, number]

/**
 * Replaces a substring within a given string type with another string type.
 */
export type Replace<S extends string, From extends string, To extends string = ''> = From extends ''
  ? S
  : S extends `${infer A}${From}${infer B}`
    ? `${A}${To}${B}`
    : never

/**
 * Type utility to make specific keys of a type T optional.
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
