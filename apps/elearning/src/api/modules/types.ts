import { type Database, type Tables } from '@/services/db'
import { type WithLocale } from '@/services/i18n'

export interface Module extends WithLocale<Tables<'modules'>> {
  skill: Skill
  steps: ModuleStep[]
}

export interface BaseModule extends WithLocale<Tables<'modules'>> {
  skill: Skill
  steps_count: number
}

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface ModuleStep extends WithLocale<Tables<'module_steps'>> {
  type: ModuleStepType
  questions: ModuleQuestion[]
  subskill_evaluations: ModuleSubskillEvaluation[]
  skill_evaluation: ModuleSkillEvaluation
}

export type ModuleStepType = Database['public']['Enums']['module_step_type']

export interface ModuleQuestion extends WithLocale<Tables<'module_questions'>> {}

export interface ModuleSkillEvaluation extends WithLocale<Tables<'module_skill_evaluations'>> {}

export interface ModuleSubskillEvaluation extends WithLocale<Tables<'module_subskill_evaluations'>> {}

export interface Skill extends WithLocale<Tables<'skills'>> {
  subskills: Subskill[]
}

export interface Subskill extends WithLocale<Tables<'subskills'>> {}
