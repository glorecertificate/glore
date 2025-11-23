import { type AnyRecord, type CamelToSnakeRecord } from './types'

/**
 * Recursively converts all keys of a record from camel case to snake case.
 *
 * @example
 * ```ts
 * const snakeCaseObj = camelToSnakeRecord({ first_name: 'John', addressInfo: { streetName: 'Main St' } })
 * // Result: { first_name: 'John', address_info: { street_name: 'Main St' } }
 * ```
 */
export const camelToSnakeRecord = <T extends AnyRecord>(record: T): CamelToSnakeRecord<T> =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, (_, lowerChar, upperChar) => `${lowerChar}_${upperChar.toLowerCase()}`)
      return value && typeof value === 'object' && !Array.isArray(value)
        ? [snakeKey, camelToSnakeRecord(value as AnyRecord)]
        : [snakeKey, value]
    })
  ) as CamelToSnakeRecord<T>
