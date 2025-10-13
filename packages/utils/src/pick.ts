import { type AnyRecord } from './types'

const pickRecord = <T extends AnyRecord, K extends keyof T>(record: T, ...keys: K[] | K[][]): Pick<T, K> =>
  keys.flat().reduce((item, key) => (key in record ? { ...item, [key]: record[key] } : item), {} as Pick<T, K>)

/**
 * Picks specific keys from a record or an array of records.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 }
 * const result = pick(obj, ['a', 'c'])
 * console.log(result) // { a: 1, c: 3 }
 */
export const pick = <T extends AnyRecord, K extends keyof T>(record: T | T[], ...keys: K[] | K[][]) => {
  if (Array.isArray(record))
    return record.map(item => pickRecord(item, ...keys)) as T extends AnyRecord ? Pick<T, K> : Pick<T, K>[]
  return pickRecord(record, ...keys) as T extends AnyRecord ? Pick<T, K> : Pick<T, K>[]
}
