import { type IntlRecord } from '@glore/i18n'
import { serialize } from '@glore/utils/serialize'
import { type AnyArray, type AnyRecord, type SnakeToCamel } from '@glore/utils/types'

import { type ForeignKey, type PublicTable, type PublicTableRow, type SelectData, type Timestamp } from '@/lib/db'

/**
 * Database record with keys tranformed to camel case and optional foreign keys and timestamps.
 *
 * @template T - The table name
 * @template I - The keys to be transformed to internationalized records
 * @template U - The keys to be kept as foreign keys or timestamps, otherwise excluded
 */
export type Entity<
  T extends PublicTable,
  I extends Exclude<keyof PublicTableRow<T>, ForeignKey<T> | Timestamp> = never,
  U extends ForeignKey<T> | Timestamp = never,
> = {
  [K in keyof Omit<
    PublicTableRow<T>,
    Exclude<ForeignKey<T> | Timestamp | 'deleted_at', U>
  > as SnakeToCamel<K>]: PublicTableRow<T>[K] extends AnyArray
    ? Entity<PublicTableRow<T>[K][number], I, U>[]
    : K extends I
      ? IntlRecord
      : PublicTableRow<T>[K]
}

/**
 * Creates a parsing function for a database record.
 */
export const createParser =
  <T extends PublicTable, Q extends string, O extends AnyRecord>(parser: (record: SelectData<T, Q>) => O) =>
  (data: SelectData<T, Q>) =>
    serialize(parser(data))
