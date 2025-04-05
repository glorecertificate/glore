import type { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

import type i18n from 'config/i18n.json'
import type { Tables } from 'supabase/types'

export type LocalizedJson = Record<keyof typeof i18n.locales, string>

export interface Auth extends SupabaseAuthClient {}

export interface User extends Omit<Tables<'profiles'>, 'avatar_url'> {
  avatar_url?: string
  modules: UserModule[]
  name: string
  orgs: UserOrg[]
}

export interface UserOrg extends Pick<Tables<'organizations'>, 'id' | 'name' | 'avatar_url' | 'country'> {
  isActive: boolean
  role: Tables<'user_organizations'>['role']
}

export interface UserModule extends Tables<'user_modules'> {}

export enum ModuleStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface Module extends Omit<Tables<'modules'>, 'title' | 'description'> {
  title: LocalizedJson
  description?: LocalizedJson
  skill: Skill
  stepsCount: number
}

export type LocalizedModule = Module & {
  title: string
  description?: string
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
