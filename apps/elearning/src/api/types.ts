import type { AnyArray, SnakeToCamelCase } from '@repo/utils'

import { getDatabase } from '@/lib/db/server'
import { type TableName, type Tables } from '@/lib/db/types'

/**
 * Entity from the database with keys transformed to camel case and optional foreign keys or timestamps.
 */
export type Entity<T extends TableName, I extends ForeignKeys<T> | Timestamps = never> = {
  [K in keyof Omit<
    Tables<T>,
    Exclude<ForeignKeys<T> | Timestamps, I>
  > as SnakeToCamelCase<K>]: Tables<T>[K] extends AnyArray ? Array<Entity<Tables<T>[K][number], I>> : Tables<T>[K]
}

/**
 * Entity with foreign keys or timestamps.
 */
export type ForeignKeys<T extends TableName> = {
  [K in keyof Tables<T>]: K extends `${string}_id` ? K : never
}[keyof Tables<T>]

/**
 * Database timestamps.
 */
export type Timestamps = 'created_at' | 'updated_at' | 'deleted_at'

/**
 * Database client.
 */
export type DatabaseClient = Awaited<ReturnType<typeof getDatabase>>

/**
 * Data returned from a database select query.
 */
export type SelectData<T extends TableName, Q extends string> = NonNullable<
  Awaited<ReturnType<ReturnType<typeof _<T, Q>>>>['data']
>
const _ =
  <T extends TableName, Q extends string>(table: T, query: Q) =>
  async () =>
    await (await getDatabase()).from(table).select(query).single()
