import { type PostgrestResponse, type PostgrestSingleResponse } from '@supabase/supabase-js'

import { serialize } from '@glore/utils/serialize'
import { type AnyRecord, type MaybePromise } from '@glore/utils/types'

import { INTL_PLACEHOLDER, type IntlRecord } from '@/lib/intl'
import {
  type DatabaseClient,
  DatabaseError,
  type DatabaseErrorCode,
  type PublicTable,
  type SelectData,
} from '../supabase'

/**
 * Expects a single record from a database query result.
 * Throws a {@link DatabaseError} if no record is found or if there is a query error.
 */
export const expectSingle = <T>(
  result: PostgrestSingleResponse<T>,
  code: DatabaseErrorCode = 'PGRST116',
  message?: string
) => {
  const { data, error } = result
  if (error) throw new DatabaseError(error)
  if (!data) throw new DatabaseError({ code, message })
  return data
}

/**
 * Expects a list of records from a database query result.
 * Throws a {@link DatabaseError} if no records are found or if there is a query error.
 */
export const expectList = <T>(result: PostgrestResponse<T>, code: DatabaseErrorCode = 'PGRST116', message?: string) => {
  const { data, error } = result
  if (error) throw new DatabaseError(error)
  if (!data || data.length === 0) throw new DatabaseError({ code, message })
  return data
}

/**
 * Creates a repository runner with the provided database resolver function.
 */
export const createRepositoryRunner =
  (resolveDatabase: () => MaybePromise<DatabaseClient>) =>
  async <T>(operation: (database: DatabaseClient) => MaybePromise<T>) => {
    const database = await resolveDatabase()
    return operation(database)
  }

/**
 * Creates a type-safe parsing function for the given database record.
 */
export const createParser =
  <T extends PublicTable, Q extends string, P, R = SelectData<T, Q>>(parser: (record: R) => P) =>
  (data: R) =>
    serialize(parser(data))

/**
 * Marks the specified keys of a record as requiring internationalization.
 */
export const withIntlKeys = <T extends AnyRecord, K extends keyof T>(record: T, keys: K[]) => {
  const localized = { ...record }
  for (const [key, value] of Object.entries(localized)) {
    if (!keys.includes(key as K)) continue
    localized[key as keyof T] = value ?? INTL_PLACEHOLDER
  }
  return localized as Omit<T, K> & Record<K, IntlRecord>
}
