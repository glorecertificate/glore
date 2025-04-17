import type { BooleanString } from '@repo/utils'

import { type IntlTables } from '@/services/db'
import type { Enums } from 'supabase/types'

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface Skill extends IntlTables<'skills'> {
  subskills: Subskill[]
}

export interface Subskill extends IntlTables<'subskills'> {}

export interface Module extends Omit<IntlTables<'modules'>, 'skill_id'> {
  type: 'introduction' | 'module'
  skill: Skill
  steps: ModuleStep[]
  steps_count: number
  completed_steps_count: number
  progress: number
  status: ModuleStatus
}

export interface ModuleStep extends Omit<IntlTables<'module_steps'>, 'module_id' | 'skill_id'> {
  type: Enums<'module_step_type'>
  questions: ModuleQuestion[]
  subskill_evaluations: ModuleSubskillEvaluation[]
  skill_evaluation?: ModuleSkillEvaluation
  completed: boolean
}

export interface ModuleQuestion extends IntlTables<'module_questions'> {
  user_answer?: BooleanString
}

export interface ModuleSubskillEvaluation extends Omit<IntlTables<'module_subskill_evaluations'>, 'subskill_id'> {
  subskill?: Subskill
  user_evaluation?: number
}

export interface ModuleSkillEvaluation extends Omit<IntlTables<'module_skill_evaluations'>, 'skill_id'> {
  skill: Skill
  user_evaluation?: number
}

export interface UserModule extends IntlTables<'user_modules'> {}

export interface UserModuleStep extends IntlTables<'user_module_steps'> {}

export interface UserAnswer extends IntlTables<'user_answers'> {}

export interface UserSubskillEvalutation extends IntlTables<'user_subskill_evaluations'> {}

export interface UserSkillEvaluation extends IntlTables<'user_skill_evaluations'> {}
