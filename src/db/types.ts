import {
  type UnstableGetResult as GetResult,
  type PostgrestBuilder,
  type PostgrestClientOptions,
  type PostgrestFilterBuilder,
} from '@supabase/postgrest-js'
import { type EmailOtpType, type SupabaseClient, type User } from '@supabase/supabase-js'
import { type IconName } from 'lucide-react/dynamic'
import { type MergeDeep } from 'type-fest'

import { type IntlRecord } from '@/lib/i18n'
import { type Any, type AnyRecord } from '@/lib/types'
import { type Enums, type Database as SupabaseDatabase } from '../../supabase/types'

export type { Enums }
export type DatabaseClient = SupabaseClient<Database, 'public'>
export type PublicSchema = Database['public']
export type TableName = keyof PublicSchema['Tables']
export type TableRow<T extends TableName> = PublicSchema['Tables'][T]['Row']
export type TableRelations<T extends TableName> = PublicSchema['Tables'][T]['Relationships']
export type TableInsert<T extends TableName> = PublicSchema['Tables'][T]['Insert']
export type TableUpdate<T extends TableName> = PublicSchema['Tables'][T]['Update']

interface Overrides<T extends AnyRecord> {
  Row: { [K in keyof T]: T[K] }
  Insert: { [K in keyof T]?: T[K] }
  Update: { [K in keyof T]?: T[K] }
}

export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Tables: {
        assessments: Overrides<{
          description: IntlRecord
        }>
        courses: Overrides<{
          title: IntlRecord
          description: IntlRecord
          icon: IconName
        }>
        doc_articles: Overrides<{
          title: IntlRecord
          content: IntlRecord
          excerpt: IntlRecord
        }>
        doc_categories: Overrides<{
          title: IntlRecord
          description: IntlRecord
        }>
        evaluations: Overrides<{
          description: IntlRecord
        }>
        lessons: Overrides<{
          title: IntlRecord
          content: IntlRecord | null
        }>
        organizations: Overrides<{
          description: IntlRecord | null
        }>
        question_options: Overrides<{
          content: IntlRecord
        }>
        questions: Overrides<{
          description: IntlRecord
          explanation: IntlRecord | null
        }>
        regions: Overrides<{
          name: IntlRecord
        }>
        skill_groups: Overrides<{
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
  PublicSchema,
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
  PublicSchema,
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
