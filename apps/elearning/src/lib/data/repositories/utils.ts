import { type PostgrestError } from '@supabase/supabase-js'

import { serialize } from '@glore/utils/serialize'
import { type AnyRecord, type MaybePromise } from '@glore/utils/types'

import { type DatabaseClient, DatabaseError, type DatabaseErrorCode } from '../supabase'

export const TIMESTAMPS = 'createdAt:created_at, updatedAt:updated_at'

/**
 * Expects a single record from a database query result.
 * Throws a {@link DatabaseError} if no record is found or if there is a query error.
 */
export const expectSingle = <T>(
  result: {
    data: T | null
    error: PostgrestError | null
  },
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
export const expectList = <T>(
  result: {
    data: T[] | null
    error: PostgrestError | null
  },
  code: DatabaseErrorCode = 'PGRST116',
  message?: string
) => {
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
  <Raw extends AnyRecord, Parsed>(parser: (record: Raw) => Parsed) =>
  (data: Raw) =>
    serialize(parser(data))
