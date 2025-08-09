import { type AnyRecord } from '@/types'

/**
 * Picks specific keys from an array of objects.
 * Returns an array of objects with only the specified keys.
 */
export const pick = <T extends AnyRecord, K extends keyof T>(records: T[], ...keys: K[]): Pick<T, K>[] =>
  records.map(record =>
    keys.reduce(
      (acc, key) =>
        key in record
          ? {
              ...acc,
              [key]: record[key],
            }
          : acc,
      {} as Pick<T, K>,
    ),
  )

export default pick
