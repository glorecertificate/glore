import { type Tables } from '@/services/db'

import type { BaseModule, Module, Skill } from './types'

interface BaseModuleRecord extends Tables<'modules'> {
  skills: Tables<'skills'> & {
    subskills: Tables<'subskills'>[]
  }
  module_steps?: {
    count: number
  }[]
}

interface ModuleRecord extends Omit<BaseModuleRecord, 'module_steps'> {
  module_steps: (Tables<'module_steps'> & {
    module_questions: Tables<'module_questions'>[]
    module_subskill_evaluations: Tables<'module_subskill_evaluations'>[]
    module_skill_evaluations: Tables<'module_skill_evaluations'>[]
  })[]
}

export const mapBaseModule = ({ module_steps, skills, ...module }: BaseModuleRecord) =>
  ({
    ...module,
    skill: skills as Skill,
    steps_count: module_steps?.at(0)?.count || 0,
  }) as BaseModule

export const mapModule = ({ module_steps, skills, ...module }: ModuleRecord) =>
  ({
    ...module,
    skill: skills as Skill,
    steps: module_steps
      .map(({ module_questions, module_skill_evaluations, module_subskill_evaluations, ...step }) => ({
        ...step,
        questions: module_questions,
        subskill_evaluations: module_subskill_evaluations,
        skill_evaluation: module_skill_evaluations.at(0),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  }) as Module
