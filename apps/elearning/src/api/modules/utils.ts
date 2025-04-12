import { type Tables, type UserModulesTable } from '@/services/db'
import { type IntlRecord } from '@/services/i18n'

import { ModuleStatus, type ModuleSkillEvaluation } from './types'

export const parseModuleStatus = ({
  module_steps,
  user_modules,
}: {
  module_steps?: {
    count: number
  }[]
  user_modules?: (UserModulesTable & {
    user_module_steps?: {
      count: number
    }[]
  })[]
}) => {
  if (!user_modules?.length) return ModuleStatus.NotStarted
  if (module_steps?.at(0)?.count === user_modules.at(0)?.user_module_steps?.at(0)?.count || 0) return ModuleStatus.Completed
  return ModuleStatus.InProgress
}

export const parseSkillEvaluations = (
  skillEvaluations: (Tables<'module_skill_evaluations'> & {
    user_skill_evaluations?: Tables<'user_skill_evaluations'>[]
  })[],
): Omit<ModuleSkillEvaluation, 'skill'> | undefined => {
  const skillEvaluation = skillEvaluations?.at(0)
  if (!skillEvaluation) return undefined

  const { description, user_skill_evaluations, ...evaluation } = skillEvaluation
  const userEvaluation = user_skill_evaluations?.at(0)?.value

  return {
    ...evaluation,
    description: description as IntlRecord,
    user_evaluation: userEvaluation,
  }
}
