import { type BooleanString } from '@repo/utils'

import { fetchCurrentUserId } from '@/api/users'
import { getClientDB, getDB } from '@/services/db'
import { type IntlRecord } from '@/services/i18n'

import {
  ModuleStatus,
  type BaseModule,
  type Module,
  type Skill,
  type UserAnswer,
  type UserModule,
  type UserModuleStep,
  type UserSkillEvaluation,
  type UserSubskillEvalutation,
} from './types'
import { parseStep } from './utils'

export const fetchAllModules = async (params: { userId?: number }): Promise<BaseModule[]> => {
  const db = await getDB()

  if (!params.userId) params.userId = await fetchCurrentUserId()
  if (!params.userId) throw new Error('User ID not found.')

  const { data, error } = await db
    .from('modules')
    .select(
      `
      *,
      skills (
        *,
        subskills (
          *
        )
      ),
      module_steps(
        *,
        user_module_steps (
          *
        ),
        module_questions (
          *,
          user_answers (
            *
          )
        ),
        module_subskill_evaluations (
          *,
          user_subskill_evaluations (
            *
          ),
          subskill:subskill_id (
            *
          )
        ),
        module_skill_evaluations (
          *,
          user_skill_evaluations (
            *
          )
        )
      ),
      user_modules (
        *
      )
    `,
    )
    .eq('user_modules.user_id', params.userId)

  if (error || !data) {
    if (error) console.error(error)
    return []
  }

  return data.map(({ description: moduleDescription, module_steps, skills, title: moduleTitle, user_modules, ...module }) => {
    const title = moduleTitle as IntlRecord
    const description = moduleDescription as IntlRecord
    const skill = skills as Skill
    const steps_count = module_steps.length
    const completed_steps = module_steps.filter(step => parseStep({ ...step, skill }).completed).length
    const progress = Math.round((completed_steps / steps_count) * 100) || 0
    const status =
      completed_steps === steps_count
        ? ModuleStatus.Completed
        : user_modules.length
          ? ModuleStatus.InProgress
          : ModuleStatus.NotStarted

    return { ...module, title, description, skill, steps_count, status, completed_steps, progress }
  })
}

export const fetchModule = async (params: { slug: string; userId?: number }): Promise<Module> => {
  const db = await getDB()

  if (!params.userId) params.userId = await fetchCurrentUserId()
  if (!params.userId) throw new Error('User ID not found.')

  const { data, error } = await db
    .from('modules')
    .select(
      `
        *,
        skills!inner (
          *,
          subskills (
            *
          )
        ),
        module_steps(
          *,
          user_module_steps (
            *
          ),
          module_questions (
            *,
            user_answers (
              *
            )
          ),
          module_subskill_evaluations (
            *,
            user_subskill_evaluations (
              *
            ),
            subskill:subskill_id (
              *
            )
          ),
          module_skill_evaluations (
            *,
            user_skill_evaluations (
              *
            )
          )
        ),
        user_modules (
          *
        )
      `,
    )
    .eq('skills.slug', params.slug)
    .eq('user_modules.user_id', params.userId)
    .eq('module_steps.module_questions.user_answers.user_id', params.userId)
    .eq('module_steps.module_subskill_evaluations.user_subskill_evaluations.user_id', params.userId)
    .eq('module_steps.module_skill_evaluations.user_skill_evaluations.user_id', params.userId)
    .single()

  if (error) throw error

  const { description, module_steps, skills, title, user_modules, ...module } = data
  const intlTitle = title as IntlRecord
  const intlDescription = description as IntlRecord
  const skill = skills as Skill
  const steps = module_steps.map(step => parseStep({ ...step, skill })).sort((a, b) => a.sort_order - b.sort_order)
  const completedSteps = steps.filter(({ completed }) => completed).length

  const status =
    completedSteps === steps.length
      ? ModuleStatus.Completed
      : user_modules.length
        ? ModuleStatus.InProgress
        : ModuleStatus.NotStarted

  return { ...module, title: intlTitle, description: intlDescription, skill, steps, status }
}

export const createUserModule = async (params: { userId: number; moduleId: number }): Promise<UserModule | null> => {
  const db = await getDB()

  const { data, error } = await db.from('user_modules').insert({ user_id: params.userId, module_id: params.moduleId }).select()

  if (error) throw error
  return data[0]
}

export const createUserModuleStep = async (params: { userId: number; moduleStepId: number }): Promise<UserModuleStep> => {
  const db = getClientDB()

  const { data, error } = await db
    .from('user_module_steps')
    .insert([{ user_id: params.userId, module_step_id: params.moduleStepId }])
    .select()

  if (error) throw error
  return data[0]
}

export const createUserAnswers = async (params: {
  userId: number
  questions: {
    id: number
    answer: BooleanString
  }[]
}): Promise<UserAnswer[] | null> => {
  const db = getClientDB()

  const { data, error } = await db
    .from('user_answers')
    .insert(params.questions.map(({ answer, id }) => ({ user_id: params.userId, question_id: id, value: answer })))
    .select()

  if (error) throw error
  return data
}

export const createUserSubskillEvaluations = async (params: {
  userId: number
  evaluations: {
    id: number
    rating: number
  }[]
}): Promise<UserSubskillEvalutation[] | null> => {
  const db = getClientDB()

  const { data, error } = await db
    .from('user_subskill_evaluations')
    .insert(params.evaluations.map(({ id, rating }) => ({ user_id: params.userId, subskill_evaluation_id: id, value: rating })))
    .select()

  if (error) throw error
  return data
}

export const createUserSkillEvaluation = async (params: {
  userId: number
  skillEvaluationId: number
  rating: number
}): Promise<UserSkillEvaluation | null> => {
  const db = getClientDB()

  const { data, error } = await db
    .from('user_skill_evaluations')
    .insert([
      {
        user_id: params.userId,
        skill_evaluation_id: params.skillEvaluationId,
        value: params.rating,
      },
    ])
    .select()

  if (error) throw error
  return data[0]
}
