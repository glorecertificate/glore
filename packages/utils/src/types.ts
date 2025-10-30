/**
 * Utility to use the `any` when needed and avoid linter warnings.
 */
// biome-ignore lint/suspicious/noExplicitAny: allow explicit any
export type Any = any

/**
 * Primitive type.
 */
export type Primitive = string | number | bigint | boolean | null | undefined

/**
 * Enum type with stringified values
 */
export type Enum<T> = T | EnumValue<T>

/**
 * Enum type with stringified keys.
 */
// @ts-expect-error-next-line
export type EnumKey<T> = T | keyof typeof T

/**
 * Enum type with stringified keys.
 */
// @ts-expect-error-next-line
export type EnumValue<T> = `${T}`

/**
 * Any object type with string keys.
 */
export type AnyRecord = Record<AnyKey, Any>

/**
 * Any array type, including nested arrays.
 */
export type AnyArray = Any[] | Any[][]

/**
 * Any type of object key.
 */
export type AnyKey = string | number | symbol

/**
 * Any callable function type.
 */
export type AnyFunction = (...args: Any[]) => Any

/**
 * Type that can be either a value of type T or a Promise resolving to type T.
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Possible JSON value types.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined
    }
  | Json[]

/**
 * Record with keys converted from snake to camel case.
 *
 * @example
 * ```ts
 * type CamelCaseString = SnakeToCamel<'hello_world'> // 'helloWorld'
 * ```
 */
export type SnakeToCamel<S extends string | number | symbol> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S

/**
 * Email type.
 */
export type Email = `${string}@${string}.${string}`

/**
 * URL type.
 */
export type HTTPUrl = `http${string}`

/**
 * Mail URL type.
 */
export type MailToUrl = `mailto:${string}`

/**
 * Message URL type.
 *
 * The URL scheme opens a new message in the user's default email application.
 */
export type MessageUrl = `message:${string}`

/**
 * Telephone URL type.
 */
export type TelUrl = `tel:${string}`

/**
 * RGB color type.
 */
export type Rgb = [number, number, number]

/**
 * `Error` type with optional `code` property.
 */
export type AnyError = Error & { code?: number }

/**
 * Replaces a substring within a given string type with another string type.
 */
export type Replace<S extends string, From extends string, To extends string = ''> = From extends ''
  ? S
  : S extends `${infer A}${From}${infer B}`
    ? `${A}${To}${B}`
    : never

/**
 * Exclude keys of U from T.
 */
export type ExcludeFrom<T extends AnyRecord, U extends AnyRecord> = Partial<{
  [K in Exclude<keyof T, keyof U>]: T[K]
}>
