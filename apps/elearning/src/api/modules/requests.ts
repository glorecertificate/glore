import { type BooleanString } from '@repo/utils'

import { getCurrentUserId } from '@/api/users'
import { getClientDB, getDB } from '@/services/db'

import { parseModule } from './parser'
import { selectModuleQuery } from './queries'
import {
  type Module,
  type UserAnswer,
  type UserModule,
  type UserModuleStep,
  type UserSkillEvaluation,
  type UserSubskillEvalutation,
} from './types'

export const getModules = async (params: { userId?: number }): Promise<Module[]> => {
  if (!params.userId) params.userId = await getCurrentUserId()
  if (!params.userId) throw new Error('User not found')

  const db = await getDB()

  const { data, error } = await db.from('modules').select(selectModuleQuery).eq('user_modules.user_id', params.userId)

  if (error) throw error
  if (!data) return []

  return data.map(module => parseModule(module))
}

export const getModule = async (params: { slug: string }): Promise<Module | null> => {
  const db = await getDB()

  try {
    const { data, error } = await db.from('modules').select(selectModuleQuery).eq('skills.slug', params.slug).single()

    if (error) console.error(error)
    if (error || !data) return null

    return parseModule(data)
  } catch (error) {
    console.error(error)
    return null
  }
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
    .upsert([{ user_id: params.userId, module_step_id: params.moduleStepId }])
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
