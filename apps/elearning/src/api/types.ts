import type { AnyArray, SnakeToCamelCase } from '@repo/utils'

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

export type ForeignKeys<T extends TableName> = {
  [K in keyof Tables<T>]: K extends `${string}_id` ? K : never
}[keyof Tables<T>]

export type Timestamps = 'created_at' | 'updated_at' | 'deleted_at'
