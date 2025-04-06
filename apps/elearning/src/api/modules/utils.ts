import { type LocalizedJson, type Tables } from '@/services/db'

import type { BaseModule, Module, ModuleStep } from './types'

interface DbBaseModule extends Tables<'modules'> {
  skills: Tables<'skills'> & {
    subskills: Tables<'subskills'>[]
  }
  module_steps?: {
    count: number
  }[]
}

interface DbModule extends Omit<DbBaseModule, 'module_steps'> {
  module_steps: Tables<'module_steps'>[]
}

export const mapBaseModule = ({ module_steps, skills, ...module }: DbBaseModule): BaseModule => ({
  ...module,
  title: module.title as LocalizedJson,
  description: module.description as LocalizedJson,
  skill: {
    ...skills,
    name: skills.name as LocalizedJson,
    description: skills.description as LocalizedJson,
    subskills: skills.subskills.map(subskill => ({
      ...subskill,
      name: subskill.name as LocalizedJson,
      description: subskill.description as LocalizedJson,
    })),
  },
  stepsCount: module_steps?.at(0)?.count || 0,
})

export const mapModule = ({ module_steps, skills, ...module }: DbModule): Module => ({
  ...module,
  title: module.title as LocalizedJson,
  description: module.description as LocalizedJson,
  skill: {
    ...skills,
    name: skills.name as LocalizedJson,
    description: skills.description as LocalizedJson,
    subskills: skills.subskills.map(subskill => ({
      ...subskill,
      name: subskill.name as LocalizedJson,
      description: subskill.description as LocalizedJson,
    })),
  },
  steps: module_steps as ModuleStep[],
})
