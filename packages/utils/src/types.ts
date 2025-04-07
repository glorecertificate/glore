/**
 * Type or array of type.
 */
export type OrArray<T> = T | T[]

/**
 * Function with any arguments and return type.
 */
export type AnyFunction = (...args: any) => any

/**
 * Any object type with string keys.
 */
export type AnyObject = Record<string, any>

/**
 * Any array type, including nested arrays.
 */
export type AnyArray = any[] | any[][]

/**
 * Any type of object key.
 */
export type AnyKey = string | number | symbol

/**
 * Record keys with dot notation.
 */
export type KeysOf<T> = T extends object
  ? {
      [K in keyof T & string]: 
        | K 
        | (T[K] extends object ? `${K}.${KeysOf<T[K]>}` : K);
    }[keyof T & string]
  : never;

/**
 * Record of parameters extracted from segments of a string path.
 * 
 * @example
 * ```ts
 * type Params = PathParams<'/users/:id/posts/:postId'>
 * // Result: { id: string; postId: string }
 * ```
 */
export type PathParams<S extends string> = S extends `${infer _}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof PathParams<Rest>]: string }
  : S extends `${infer _}:${infer Param}`
    ? Record<Param, string>
    : AnyObject

/**
 * Partial record with non-nullable values.
 */
export type NonNullablePartial<T> = Partial<{
  [K in keyof T]: NonNullable<T[K]>
}>

/**
 * Record with `null` values converted to `undefined`.
 */
export type NullToUndefined<T> = {
  [K in keyof T]: null extends T[K] ? NonNullable<T[K]> | undefined : T[K]
}

/**
 * Type or null type.
 */
export type Nullable<T> = T | null

/**
 * Primitive type.
 */
export type Primitive = string | number | bigint | boolean | null | undefined

/**
 * Record with recursive values.
 */
export interface Recursive<T> {
  [key: string]: Recursive<T> | T
}

/**
 * String or number type.
 */
export type StringOrNumber = string | number

/**
 * Boolean type from the string representation of boolean.
 */
export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

/**
 * String from any type.
 */
export type ToString<T> = T extends string ? T : string

/**
 * Record without the specified keys.
 */
export type Without<T, K> = Pick<T, Exclude<keyof T, K>>

/**
 * URL type.
 */
export type HTTPUrl = `http${string}`
