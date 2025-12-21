/**
 * Casts a value to a specific type.
 *
 * **Warning:** Use this function with caution, as it bypasses TypeScript's type checking.
 *
 * @example
 * ```ts
 * const value = castType<number>('123')
 * type ValueType = typeof value // number
 * ```
 */
export const castType = <T>(value: unknown) => value as T
