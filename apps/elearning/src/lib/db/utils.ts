import { PostgrestError, type PostgrestResponse, type PostgrestSingleResponse } from '@supabase/supabase-js'

import type { Any } from '@glore/utils/types'

/**
 * Custom Supabase error class extending {@link PostgrestError}.
 */
export class SupabaseError extends PostgrestError {
  constructor({ message = 'An error occurred', code = 'PGRST116', details = '', hint = '' } = {}) {
    super({ message, code, details, hint })
    this.name = 'SupabaseError'
  }
}

interface SupabaseResolveOptions<T, U = T> {
  message?: string
  parser?: (data: T) => U
}

/**
 * Resolves a Supabase response, throwing an error if one occurred.
 */
export function resolveSupabaseResponse<T, U = T>(
  response: PostgrestSingleResponse<T>,
  options?: SupabaseResolveOptions<T, U>
): U
export function resolveSupabaseResponse<T, U = T>(
  response: PostgrestResponse<T>,
  options?: SupabaseResolveOptions<T, U>
): U[]
export function resolveSupabaseResponse<T, U = T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>,
  options: SupabaseResolveOptions<T, U> = {}
): U | U[] {
  const { message, parser = data => data as Any as U } = options

  const { data, error } = response
  if (error) throw error
  if (Array.isArray(data)) {
    if (data.length > 0) return data.map(parser)
    if (message) throw new SupabaseError({ message })
  }
  if (!data && message) throw new SupabaseError({ message })

  return parser(data as T)
}
