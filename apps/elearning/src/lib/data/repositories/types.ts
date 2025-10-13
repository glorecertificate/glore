import { type AnyArray, type SnakeToCamel } from '@glore/utils/types'

import { type IntlRecord } from '@/lib/intl'
import { type ForeignKey, type PublicTable, type PublicTableRow, type Timestamp } from '../supabase'

/**
 * Database record with keys tranformed to camel case
 * and optional foreign keys and timestamps.
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
