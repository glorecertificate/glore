import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/postgrest-js'
import { PostgrestError } from '@supabase/supabase-js'

import type { DatabaseBuilder, DatabaseFilterBuilder, DatabaseRow } from '@/db/types'

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
 * Normalizes an unknown error into a {@link PostgrestError}.
 */
export const postgrestError = (e: unknown) => {
  const error = e as ConstructorParameters<typeof PostgrestError>[0] | undefined
  return new PostgrestError({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'An unknown error occurred',
    details: error?.details ?? '',
    hint: error?.hint ?? '',
  })
}
