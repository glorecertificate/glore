import { type EmailOtpType, type SupabaseClient, type User } from '@supabase/supabase-js'

import { type AnyRecord } from '@glore/utils/types'

import { type Database } from '../../../../supabase/types'

export type { Database, Enums, Tables } from '../../../../supabase/types'

export type DatabaseClient = SupabaseClient<Database, 'public', PublicSchema>

export type PublicSchema = Database['public']
export type PublicTable = keyof PublicSchema['Tables']
export type PublicTableRow<T extends PublicTable> = PublicSchema['Tables'][T]['Row']

export type ForeignKey<T extends PublicTable> = {
  [K in keyof PublicTableRow<T>]: K extends `${string}_id` ? K : never
}[keyof PublicTableRow<T>]

export type Timestamp = 'created_at' | 'updated_at'

export type SelectData<T extends PublicTable, Q extends string> = AnyRecord & {
  /** Phantom tuple to preserve table/query generics without affecting runtime shape. */
  readonly __meta?: [T, Q]
}

/** @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook */
export interface AuthEmailInput {
  email_data: {
    email_action_type: EmailOtpType
    redirect_to: string
    site_url: string
    token_hash_new: string
    token_hash: string
    token_new: string
    token: string
  }
  user: User
}
