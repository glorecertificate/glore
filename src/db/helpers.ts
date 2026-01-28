import { type PostgrestResponse, type PostgrestSingleResponse } from '@supabase/postgrest-js'
import { PostgrestError } from '@supabase/supabase-js'

import { type DatabaseBuilder, type DatabaseFilterBuilder, type DatabaseRow } from '@/db/types'

/**
 * Resolves a Postgrest query.
 *
 * @return The response from the query parsed through the provided parser function.
 */
export async function resolveQuery<T extends unknown[], R = DatabaseRow<T>>(
  query: DatabaseFilterBuilder<T>,
  parser?: (data: DatabaseRow<T>) => R
): Promise<PostgrestResponse<R>>
export async function resolveQuery<T, R = T>(
  query: DatabaseBuilder<T>,
  parser?: (data: T) => R
): Promise<PostgrestSingleResponse<R>>
export async function resolveQuery<T, R>(
  query: DatabaseBuilder<T> | DatabaseFilterBuilder<T>,
  parser?: (data: T | DatabaseRow<T>) => R
): Promise<PostgrestResponse<R> | PostgrestSingleResponse<R>> {
  const { count, data, error, ...status } = await query
  if (error) return { ...status, count: null, data: null, error }
  const result = parser ? (Array.isArray(data) ? data.map(item => parser(item as DatabaseRow<T>)) : parser(data)) : data
  return { ...status, count, data: result as R, error: null }
}

/**
 * Normalizes an unknown error or error message into a {@link PostgrestError}.
 */
export const postgrestError = (e: unknown) => {
  if (e instanceof PostgrestError) return e
  const context = { code: 'UNKNOWN', details: '', hint: '', message: 'An unknown error occurred' }
  if (e instanceof Error && e.message) context.message = e.message
  if (typeof e === 'string') context.message = e
  return new PostgrestError(context)
}
