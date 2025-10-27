import { type AnyRecord } from './types'

/**
 * Excludes specific keys from a record or an array of records.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 }
 * const result = omit(obj, ['b'])
 * console.log(result) // { a: 1, c: 3 }
 */
export const omit = <T extends AnyRecord, K extends keyof T>(record: T, keys: K | K[]): Omit<T, K> => {
  const object = { ...record }
  for (const key of [keys].flat()) {
    if (key in object) delete object[key]
  }
  return object
}
