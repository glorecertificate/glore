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
 * Snake case to camel case conversion.
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
 * Camel case to snake case conversion.
 *
 * @example
 * ```ts
 * type SnakeCaseString = CamelToSnake<'helloWorld'> // 'hello_world'
 * ```
 */
export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${T}${CamelToSnake<U>}`
    : `${T}_${Lowercase<CamelToSnake<U>>}`
  : S

/**
 * Converts the top-level keys of a record from snake case to camel case.
 *
 * @example
 * ```ts
 * type CamelCaseRecord = SnakeToCamelRecord<{ first_name: string; address_info: { street_name: string } }>
 * // Result: { first_name: string; addressInfo: { streetName: string } }
 * ```
 */
export type SnakeToCamelRecord<T extends AnyRecord> = {
  [K in keyof T as SnakeToCamel<K>]: T[K] extends AnyRecord
    ? SnakeToCamelRecord<T[K]>
    : T[K] extends AnyArray
      ? T[K] extends Array<infer U>
        ? U extends AnyRecord
          ? SnakeToCamelRecord<U>[]
          : T[K]
        : T[K]
      : T[K]
}

/**
 * Recursively converts all keys of a record from camel case to snake case.
 *
 * @example
 * ```ts
 * type SnakeCaseRecord = CamelToSnakeRecord<{ first_name: string; addressInfo: { streetName: string } }>
 * // Result: { first_name: string; address_info: { street_name: string } }
 * ```
 */
export type CamelToSnakeRecord<T extends AnyRecord> = {
  [K in keyof T as CamelToSnake<K & string>]: T[K] extends AnyRecord
    ? CamelToSnakeRecord<T[K]>
    : T[K] extends AnyArray
      ? T[K] extends Array<infer U>
        ? U extends AnyRecord
          ? CamelToSnakeRecord<U>[]
          : T[K]
        : T[K]
      : T[K]
}

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

/**
 * Makes all properties of T recursively optional.
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends {
          [key in keyof T]: T[key]
        }
      ? {
          [K in keyof T]?: DeepPartial<T[K]>
        }
      : T
