import { type AnyRecord } from '@/types'

export const pick = <T extends AnyRecord, K extends keyof T>(records: T[], ...keys: K[]): Array<Pick<T, K>> =>
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
