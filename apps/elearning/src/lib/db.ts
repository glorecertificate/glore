import {
  type SignInWithPasswordCredentials,
  type SupabaseClient,
  type User,
  type UserAttributes,
  type UserResponse,
  type VerifyOtpParams,
  createClient,
} from '@supabase/supabase-js'
import { type Database } from 'supabase/types'

export type * from 'supabase/types'

export type DatabaseClient = SupabaseClient<Database, 'public'>

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

export type AuthEmailAction = 'email_change' | 'email' | 'invite' | 'magiclink' | 'signup' | 'recovery'

/** @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook */
export interface AuthEmailInput {
  email_data: {
    email_action_type: AuthEmailAction
    redirect_to: string
    site_url: string
    token_hash_new: string
    token_hash: string
    token_new: string
    token: string
  }
  user: User
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
