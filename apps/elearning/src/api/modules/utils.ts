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

export const mapBaseModule = ({ module_steps, skills, ...module }: BaseModuleRecord) =>
  ({
    ...module,
    skill: skills as Skill,
    stepsCount: module_steps?.at(0)?.count || 0,
  }) as BaseModule

interface ModuleRecord extends Omit<BaseModuleRecord, 'module_steps'> {
  module_steps: Tables<'module_steps'>[]
}

export const mapModule = ({ module_steps, skills, ...module }: ModuleRecord) =>
  ({
    ...module,
    skill: skills as Skill,
    steps: module_steps.sort((a, b) => a.sort_order - b.sort_order),
  }) as Module
