import { type LocalizedJson, type Module } from '@/services/db/types'
import type { Tables } from 'supabase/types'

interface DbModule extends Tables<'modules'> {
  skills: Tables<'skills'> & {
    subskills: Tables<'subskills'>[]
  }
  module_steps: {
    count: number
  }[]
}

export const mapModule = (module: DbModule): Module => ({
  ...module,
  title: module.title as LocalizedJson,
  description: module.description as LocalizedJson,
  skill: {
    ...module.skills,
    name: module.skills.name as LocalizedJson,
    description: module.skills.description as LocalizedJson,
    subskills: module.skills.subskills.map(subskill => ({
      ...subskill,
      name: subskill.name as LocalizedJson,
      description: subskill.description as LocalizedJson,
    })),
  },
  stepsCount: module.module_steps.at(0)?.count || 0,
})
