import type { EmailOtpType, SupabaseClient, User } from '@supabase/supabase-js'
import type { MergeDeep } from 'type-fest'

import type { IntlRecord } from '@/lib/i18n'
// biome-ignore lint: no-restricted-imports
import type { Enums, Json, Database as SupabaseDatabase, Tables } from '../../../supabase/types'

export type { Enums, Json, Tables }

export type DatabaseClient = SupabaseClient<Database, 'public'>
export type DatabaseTable = keyof Database['public']['Tables']
export type DatabaseInsert<Table extends DatabaseTable> = Database['public']['Tables'][Table]['Insert']
export type DatabaseUpdate<Table extends DatabaseTable> = Database['public']['Tables'][Table]['Update']

export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Tables: {
        assessments: {
          Row: {
            description: IntlRecord | null
          }
          Insert: {
            description?: IntlRecord | null
          }
          Update: {
            description?: IntlRecord | null
          }
        }
        courses: {
          Row: {
            description: IntlRecord
            title: IntlRecord
          }
          Insert: {
            description?: IntlRecord
            title?: IntlRecord
          }
          Update: {
            description?: IntlRecord
            title?: IntlRecord
          }
        }
        evaluations: {
          Row: {
            description: IntlRecord
          }
          Insert: {
            description: IntlRecord
          }
          Update: {
            description?: IntlRecord
          }
        }
        lessons: {
          Row: {
            content: IntlRecord | null
            title: IntlRecord
          }
          Insert: {
            content?: IntlRecord | null
            title: IntlRecord
          }
          Update: {
            content?: IntlRecord | null
            title?: IntlRecord
          }
        }
        organizations: {
          Row: {
            description: IntlRecord | null
          }
          Insert: {
            description?: IntlRecord | null
          }
          Update: {
            description?: IntlRecord | null
          }
        }
        question_options: {
          Row: {
            content: IntlRecord
          }
          Insert: {
            content: IntlRecord
          }
          Update: {
            content?: IntlRecord
          }
        }
        questions: {
          Row: {
            description: IntlRecord
            explanation: IntlRecord | null
          }
          Insert: {
            description: IntlRecord
            explanation?: IntlRecord | null
          }
          Update: {
            description?: IntlRecord
            explanation?: IntlRecord | null
          }
        }
        regions: {
          Row: {
            name: IntlRecord
          }
          Insert: {
            name: IntlRecord
          }
          Update: {
            name?: IntlRecord
          }
        }
        skill_groups: {
          Row: {
            name: IntlRecord
          }
          Insert: {
            name: IntlRecord
          }
          Update: {
            name?: IntlRecord
          }
        }
      }
    }
  }
>

/**
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */
export interface SendEmailHookInput {
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
