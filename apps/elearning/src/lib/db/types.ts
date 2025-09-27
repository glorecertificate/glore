import { type IntlRecord } from '@repo/i18n'
import type { AnyArray, SnakeToCamel } from '@repo/utils/types'

import { type Database } from 'supabase/types'

import { type DATABASE_ERRORS } from './config'
import { createDatabase } from './ssr'

/**
 * Database public schema.
 */
export type PublicSchema = Database['public']

/**
 * Name of a table in the public schema.
 */
export type PublicTable = keyof PublicSchema['Tables']

/**
 * Row from a table in the public schema.
 */
export type TableRow<T extends PublicTable> = PublicSchema['Tables'][T]['Row']

/**
 * Entity from the database with keys tranformed to camel case,
 * with optional foreign keys and timestamps.
 */
export type Entity<
  T extends PublicTable,
  L extends Exclude<keyof TableRow<T>, ForeignKey<T> | Timestamp> = never,
  U extends ForeignKey<T> | Timestamp = never,
> = {
  [K in keyof Omit<
    TableRow<T>,
    Exclude<ForeignKey<T> | Timestamp | 'deleted_at', U>
  > as SnakeToCamel<K>]: TableRow<T>[K] extends AnyArray
    ? Entity<TableRow<T>[K][number], L, U>[]
    : K extends L
      ? IntlRecord
      : TableRow<T>[K]
}

/**
 * Database client.
 */
export type DatabaseClient = Awaited<ReturnType<typeof createDatabase>>

/**
 * Data returned from a database single select query.
 */
export type SelectData<T extends PublicTable, Q extends string> = NonNullable<
  Awaited<ReturnType<ReturnType<typeof _singleSelect<T, Q>>>>['data']
>
const _singleSelect =
  <T extends PublicTable, Q extends string>(table: T, query: Q) =>
  async () =>
    await (await createDatabase()).from(table).select(query).single()

/**
 * Foreign key of a table in the public schema.
 */
export type ForeignKey<T extends PublicTable> = {
  [K in keyof TableRow<T>]: K extends `${string}_id` ? K : never
}[keyof TableRow<T>]

/**
 * Timestamps fields in a table.
 */
export type Timestamp = 'created_at' | 'updated_at'

/**
 * Database error code.
 */
export type DatabaseErrorCode = (typeof DATABASE_ERRORS)[keyof typeof DATABASE_ERRORS]['codes'][number]
