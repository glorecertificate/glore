import { fetchCurrentUserId } from '@/api/users'
import { getDB } from '@/services/db'
import { type IntlRecord } from '@/services/i18n'

import {
  ModuleStatus,
  type BaseModule,
  type Module,
  type ModuleQuestion,
  type ModuleStep,
  type ModuleSubskillEvaluation,
  type Skill,
  type UserModule,
} from './types'
import { parseModuleStatus, parseSkillEvaluations } from './utils'

export const fetchAllModules = async (userId?: number): Promise<BaseModule[]> => {
  const db = await getDB()

  if (!userId) userId = await fetchCurrentUserId()
  if (!userId) throw new Error('User ID not found.')

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
      module_steps(count),
      user_modules (
        *,
        user_module_steps(count)
      )
    `,
    )
    .eq('user_modules.user_id', userId)

  if (error || !data) {
    if (error) console.error(error)
    return []
  }

  return data.map(({ description: moduleDescription, module_steps, skills, title: moduleTitle, user_modules, ...module }) => {
    const title = moduleTitle as IntlRecord
    const description = moduleDescription as IntlRecord
    const skill = skills as Skill
    const steps_count = module_steps?.at(0)?.count || 0
    const status = parseModuleStatus({ module_steps, user_modules })
    const completed_steps = user_modules.at(0)?.user_module_steps?.at(0)?.count || 0
    const progress = user_modules?.length
      ? steps_count && completed_steps
        ? Math.round((completed_steps / steps_count) * 100)
        : 0
      : undefined

    return { ...module, title, description, skill, steps_count, status, completed_steps, progress }
  })
}

export const fetchModule = async (slug: string, userId?: number): Promise<Module> => {
  const db = await getDB()

  if (!userId) userId = await fetchCurrentUserId()
  if (!userId) throw new Error('User ID not found.')

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
    .eq('skills.slug', slug)
    .eq('user_modules.user_id', userId)
    .eq('module_steps.module_questions.user_answers.user_id', userId)
    .eq('module_steps.module_subskill_evaluations.user_subskill_evaluations.user_id', userId)
    .eq('module_steps.module_skill_evaluations.user_skill_evaluations.user_id', userId)
    .single()

  if (!data) {
    if (error) {
      console.error(error)
      throw error
    }
    throw new Error('Module not found')
  }

  const title = data.title as IntlRecord
  const description = data.description as IntlRecord
  const skill = data.skills as Skill

  const steps = data.module_steps
    .map(
      ({ module_questions, module_skill_evaluations, module_subskill_evaluations, user_module_steps, ...step }): ModuleStep => {
        const skillEvaluation = parseSkillEvaluations(module_skill_evaluations)
        const completed = !!user_module_steps.find(userModule => userModule.module_step_id === step.id) || false

        return {
          ...step,
          title: step.title as IntlRecord,
          description: step.description as IntlRecord,
          content: step.content as IntlRecord,
          completed,
          questions: module_questions.map(({ user_answers, ...question }) => ({
            ...question,
            user_answer: user_answers?.at(0)?.value,
          })) as ModuleQuestion[],
          subskill_evaluations: module_subskill_evaluations.map(
            ({ subskill_id, user_subskill_evaluations, ...subskill_evaluation }) => {
              const subskill = skill.subskills.find(({ id }) => id === subskill_id)

              return {
                ...subskill_evaluation,
                subskill,
                user_evaluation: user_subskill_evaluations?.at(0)?.value,
              }
            },
          ) as ModuleSubskillEvaluation[],
          skill_evaluation: skillEvaluation
            ? {
                ...skillEvaluation,
                skill,
              }
            : undefined,
        }
      },
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  const completedSteps = steps.filter(({ completed }) => completed).length

  const status =
    completedSteps === steps.length
      ? ModuleStatus.Completed
      : completedSteps > 0
        ? ModuleStatus.InProgress
        : ModuleStatus.NotStarted

  return { ...data, title, description, skill, steps, status }
}

export const createUserModule = async (userId: number, moduleId: number): Promise<UserModule | null> => {
  const db = await getDB()

  const { data, error } = await db.from('user_modules').insert({ user_id: userId, module_id: moduleId }).select()

  if (error || !data) {
    if (error) console.error(error)
    return null
  }

  return data[0]
}
