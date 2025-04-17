import type { BooleanString } from '@repo/utils'

import type {
  ModuleQuestionsTable,
  ModuleSkillEvaluationsTable,
  ModulesTable,
  ModuleStepsTable,
  ModuleSubskillEvaluationsTable,
  SkillsTable,
  SubskillsTable,
  UserAnswersTable,
  UserModulesTable,
  UserModuleStepsTable,
  UserSkillEvaluationsTable,
  UserSubskillEvaluationsTable,
} from '@/services/db'
import type { Enums } from 'supabase/types'

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface Skill extends SkillsTable {
  subskills: Subskill[]
}

export interface Subskill extends SubskillsTable {}

export interface BaseModule extends ModulesTable {
  skill: Skill
  steps_count: number
  status: ModuleStatus
  completed_steps: number
  progress?: number
}
// module_steps, skills, user_modules } = data
export interface Module extends Omit<ModulesTable, 'skill_id'> {
  type: 'introduction' | 'module'
  skill: Skill
  steps: ModuleStep[]
  steps_count: number
  completed_steps_count: number
  progress: number
  status: ModuleStatus
}

export interface ModuleStep extends ModuleStepsTable {
  type: Enums<'module_step_type'>
  questions: ModuleQuestion[]
  subskill_evaluations: ModuleSubskillEvaluation[]
  skill_evaluation?: ModuleSkillEvaluation
  completed: boolean
}

export interface ModuleQuestion extends ModuleQuestionsTable {
  user_answer?: BooleanString
}

export interface ModuleSubskillEvaluation extends Omit<ModuleSubskillEvaluationsTable, 'subskill_id'> {
  subskill?: Subskill
  user_evaluation?: number
}

export interface ModuleSkillEvaluation extends Omit<ModuleSkillEvaluationsTable, 'skill_id'> {
  skill: Skill
  user_evaluation?: number
}

export interface ModuleEvaluation extends ModuleSkillEvaluation, ModuleSubskillEvaluation {}

export interface UserModule extends UserModulesTable {}

export interface UserModuleStep extends UserModuleStepsTable {}

export interface UserAnswer extends UserAnswersTable {}

export interface UserSubskillEvalutation extends UserSubskillEvaluationsTable {}

export interface UserSkillEvaluation extends UserSkillEvaluationsTable {}
