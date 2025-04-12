import type { BooleanString } from '@repo/utils'

import type {
  ModuleQuestionsTable,
  ModuleSkillEvaluationsTable,
  ModulesTable,
  ModuleStepsTable,
  ModuleSubskillEvaluationsTable,
  SkillsTable,
  SubskillsTable,
  UserModulesTable,
} from '@/services/db'
import type { Enums } from 'supabase/types'

export type Skill = SkillsTable & {
  subskills: Subskill[]
}

export type Subskill = SubskillsTable

export type BaseModule = ModulesTable & {
  skill: Skill
  steps_count: number
  status: ModuleStatus
  completed_steps: number
  progress?: number
}

export type Module = ModulesTable & {
  skill: Skill
  steps: ModuleStep[]
  status: ModuleStatus
}

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export type ModuleStep = ModuleStepsTable & {
  type: Enums<'module_step_type'>
  questions: ModuleQuestion[]
  subskill_evaluations: ModuleSubskillEvaluation[]
  skill_evaluation?: ModuleSkillEvaluation
  completed: boolean
}

export type ModuleQuestion = ModuleQuestionsTable & {
  user_answer?: BooleanString
}

export type ModuleSubskillEvaluation = Omit<ModuleSubskillEvaluationsTable, 'subskill_id'> & {
  subskill?: Subskill
  user_evaluation?: number
}

export type ModuleSkillEvaluation = Omit<ModuleSkillEvaluationsTable, 'skill_id'> & {
  skill: Skill
  user_evaluation?: number
}

export type UserModule = UserModulesTable

export type UserModuleStep = UserModulesTable
