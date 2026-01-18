import {
  type UnstableGetResult as GetResult,
  type PostgrestBuilder,
  type PostgrestClientOptions,
  type PostgrestFilterBuilder,
} from '@supabase/postgrest-js'
import { type EmailOtpType, type SupabaseClient, type User } from '@supabase/supabase-js'
import { type MergeDeep } from 'type-fest'

import { type IntlRecord } from '@/lib/i18n'
import { type Any, type AnyRecord } from '@/lib/types'
import { type Enums, type Database as SupabaseDatabase } from '../../supabase/types'

export type { Enums }
export type DatabaseClient = SupabaseClient<Database, 'public'>
export type DatabaseSchema = Database['public']
export type TableName = keyof DatabaseSchema['Tables']
export type TableRow<T extends TableName> = DatabaseSchema['Tables'][T]['Row']
export type TableRelations<T extends TableName> = DatabaseSchema['Tables'][T]['Relationships']
export type TableInsert<T extends TableName> = DatabaseSchema['Tables'][T]['Insert']
export type TableUpdate<T extends TableName> = DatabaseSchema['Tables'][T]['Update']
interface TableOverrides<T extends AnyRecord> {
  Row: { [K in keyof T]: T[K] }
  Insert: { [K in keyof T]?: T[K] }
  Update: { [K in keyof T]?: T[K] }
}

export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Tables: {
        assessments: TableOverrides<{
          description: IntlRecord
        }>
        courses: TableOverrides<{
          description: IntlRecord
          title: IntlRecord
        }>
        evaluations: TableOverrides<{
          description: IntlRecord
        }>
        lessons: TableOverrides<{
          content: IntlRecord | null
          title: IntlRecord
        }>
        organizations: TableOverrides<{
          description: IntlRecord | null
        }>
        question_options: TableOverrides<{
          content: IntlRecord
        }>
        questions: TableOverrides<{
          description: IntlRecord
          explanation: IntlRecord | null
        }>
        regions: TableOverrides<{
          name: IntlRecord
        }>
        skill_groups: TableOverrides<{
          name: IntlRecord
        }>
      }
    }
  }
>

export type DatabaseBuilder<T> = PostgrestBuilder<Any, T>
export type DatabaseFilterBuilder<T> = PostgrestFilterBuilder<Any, Any, Any, T>
export type DatabaseRow<T> = T extends (infer U)[] ? U : T

export type DatabaseQuery<
  Table extends TableName,
  Query extends string = '*',
  Relation = unknown,
  Method = unknown,
> = PostgrestFilterBuilder<
  PostgrestClientOptions,
  DatabaseSchema,
  TableRow<Table>,
  DatabaseResult<Table, Query>[],
  Relation,
  TableRelations<Table>,
  Method
>

export type DatabaseSingleQuery<Table extends TableName, Query extends string = '*'> = PostgrestBuilder<
  PostgrestClientOptions,
  DatabaseResult<Table, Query>
>

export type DatabaseResult<Table extends TableName, Query extends string = '*', Relation = Table> = GetResult<
  DatabaseSchema,
  TableRow<Table>,
  Relation,
  TableRelations<Table>,
  Query,
  PostgrestClientOptions
>

/** @see {@link https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook|Supabase Email Hook} */
export interface DatabaseHookPayload {
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

export type * from './queries'
