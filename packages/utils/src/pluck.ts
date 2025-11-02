import { type AnyRecord } from './types'

/**
 * Plucks a specific key's values from an array of records.
 *
 * @example
 * ```ts
 * const input = [{ a: 1, b: 2 }, { a: 3, b: 4 }]
 * const result = pluck(input, 'a')
 * console.log(result) // [1, 3]
 * ```
 */
export const pluck = <T extends AnyRecord, K extends keyof T>(array: T[], key: K): T[K][] =>
  array.map(item => item[key])
