import { type SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

import { type AnyArray, type Primitive } from '@repo/utils'

import { type IntlRecord } from '@/services/i18n'
import { type Database, type Tables } from 'supabase/types'

export type * from 'supabase/types'

export interface AuthClient extends SupabaseAuthClient {}

export type IntlTables<T extends TableName> = {
  [K in keyof Tables<T>]: Tables<T>[K] extends AnyArray
    ? IntlTables<Tables<T>[K][number]>[]
    : Tables<T>[K] extends Primitive
      ? Tables<T>[K]
      : IntlRecord
}

export type TableName = keyof Database[Extract<keyof Database, 'public'>]['Tables']

export type SkillsTable = IntlTables<'skills'>
export type SubskillsTable = IntlTables<'subskills'>
export type ModulesTable = IntlTables<'modules'>
export type ModuleStepsTable = IntlTables<'module_steps'>
export type ModuleQuestionsTable = IntlTables<'module_questions'>
export type ModuleSubskillEvaluationsTable = IntlTables<'module_subskill_evaluations'>
export type ModuleSkillEvaluationsTable = IntlTables<'module_skill_evaluations'>
export type UserModulesTable = IntlTables<'user_modules'>
export type UserModuleStepsTable = IntlTables<'user_module_steps'>
export type UserAnswersTable = IntlTables<'user_answers'>
export type UserSkillEvaluationsTable = IntlTables<'user_skill_evaluations'>
export type UserSubskillEvaluationsTable = IntlTables<'user_subskill_evaluations'>
