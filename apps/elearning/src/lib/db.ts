import {
  createClient,
  type SignInWithPasswordCredentials,
  type SupabaseClient,
  type User,
  type UserAttributes,
  type UserResponse,
  type VerifyOtpParams,
} from '@supabase/supabase-js'

import { noop } from '@glore/utils/noop'

import { type Database } from '@/../supabase/types'
export type * from '@/../supabase/types'

export type DatabaseClient = SupabaseClient<Database, 'public', Database['public']>

export type PublicSchema = Database['public']
export type PublicTable = keyof PublicSchema['Tables']
export type PublicTableRow<T extends PublicTable> = PublicSchema['Tables'][T]['Row']

export type ForeignKey<T extends PublicTable> = {
  [K in keyof PublicTableRow<T>]: K extends `${string}_id` ? K : never
}[keyof PublicTableRow<T>]

export type Timestamp = 'created_at' | 'updated_at'

export type SelectData<T extends PublicTable, Q extends string> = NonNullable<
  Awaited<ReturnType<typeof _singleSelect<T, Q>>>['data']
>
const _singleSelect = <T extends PublicTable, Q extends string>(table: T, query: Q) =>
  createClient<Database, 'public'>('', '').from(table).select(query).single()

export type AuthUser = User
export type AuthUserAttributes = UserAttributes
export type AuthUserResponse = UserResponse

export type AuthCredentials = SignInWithPasswordCredentials
export type AuthVerifyParams = VerifyOtpParams

/**
 * Custom error for handling database-related events.
 */
export class DatabaseError extends Error {
  readonly code: (typeof DatabaseError.errors)[number]['codes'][number]

  constructor(code: (typeof DatabaseError.errors)[number]['codes'][number], message?: string) {
    const group = DatabaseError.errors.find(error => error.codes.includes(code as never))
    super(message ?? group?.message)
    this.name = 'DatabaseError'
    this.code = code
  }

  private static errors = [
    { codes: ['INVALID_CREDENTIALS', 'invalid_credentials'], message: 'Invalid credentials' },
    { codes: ['NETWORK_ERROR'], message: 'Network error' },
    { codes: ['NO_RESULTS', 'PGRST116'], message: 'No results found' },
  ] as const
}

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/

/**
 * Formatted timestamps for GraphQL queries.
 */
export const timestamps = `
  createdAt:created_at,
  updatedAt:updated_at
`

/**
 * Creates a server-side database client.
 */
export const createDatabaseClient = async (callback = noop) => {
  const { cookies } = await import('next/headers')
  const { createServerClient } = await import('@supabase/ssr')

  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll,
      setAll(cookies) {
        for (const { name, options, value } of cookies) {
          set(name, value, options)
        }
        callback()
      },
    },
  }) as DatabaseClient
}
