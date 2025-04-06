import { type Database, type LocalizedJson, type Tables } from '@/services/db'

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface Module extends Omit<Tables<'modules'>, 'title' | 'description'> {
  title: LocalizedJson
  description?: LocalizedJson
  skill: Skill
  steps?: ModuleStep[]
}

export interface BaseModule extends Omit<Module, 'steps'> {
  stepsCount: number
}

export type LocalizedModule = Module & {
  title: string
  description?: string
}

export type ModuleStepType = Database['public']['Enums']['module_step_type']

export interface ModuleStep extends Omit<Tables<'module_steps'>, 'title' | 'description' | 'content'> {
  title: LocalizedJson
  description?: LocalizedJson
  content: LocalizedJson
  type: ModuleStepType
  questions?: ModuleQuestion[]
  subskillEvaluations?: ModuleSubskillEvaluation[]
  skillEvaluation?: ModuleSkillEvaluation
}

export interface ModuleQuestion extends Omit<Tables<'module_questions'>, 'description' | 'true_answer' | 'false_answer'> {
  description?: LocalizedJson
  trueAnswer: LocalizedJson
  falseAnswer: LocalizedJson
}

export interface ModuleSkillEvaluation extends Omit<Tables<'module_skill_evaluations'>, 'description'> {
  description?: LocalizedJson
}

export interface ModuleSubskillEvaluation extends Omit<Tables<'module_subskill_evaluations'>, 'description'> {
  description?: LocalizedJson
}

export interface Skill extends Omit<Tables<'skills'>, 'name' | 'description'> {
  name: LocalizedJson
  description?: LocalizedJson
  subskills: Subskill[]
}

export interface Subskill extends Omit<Tables<'subskills'>, 'name' | 'description'> {
  name: LocalizedJson
  description?: LocalizedJson
}
