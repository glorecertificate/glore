import { type Tables, type UserModuleStepsTable } from '@/services/db'
import { type IntlRecord } from '@/services/i18n'

import {
  type ModuleQuestion,
  type ModuleSkillEvaluation,
  type ModuleStep,
  type ModuleSubskillEvaluation,
  type Skill,
} from './types'

export const parseStep = ({
  module_questions,
  module_skill_evaluations,
  module_subskill_evaluations,
  skill,
  user_module_steps,
  ...step
}: Tables<'module_steps'> & {
  skill: Skill
  user_module_steps: UserModuleStepsTable[]
  module_questions: (Tables<'module_questions'> & {
    user_answers: Tables<'user_answers'>[]
  })[]
  module_subskill_evaluations: (Tables<'module_subskill_evaluations'> & {
    subskill: Tables<'subskills'>
    user_subskill_evaluations: Tables<'user_subskill_evaluations'>[]
  })[]
  module_skill_evaluations: (Tables<'module_skill_evaluations'> & {
    user_skill_evaluations: Tables<'user_skill_evaluations'>[]
  })[]
}): ModuleStep => {
  const questions = module_questions.map(({ user_answers, ...question }) => ({
    ...question,
    user_answer: user_answers?.at(0)?.value,
  })) as ModuleQuestion[]
  const subskill_evaluations = module_subskill_evaluations.map(
    ({ subskill_id, user_subskill_evaluations, ...subskill_evaluation }) => {
      const subskill = skill.subskills.find(({ id }) => id === subskill_id)
      return {
        ...subskill_evaluation,
        subskill,
        user_evaluation: user_subskill_evaluations?.at(0)?.value,
      }
    },
  ) as ModuleSubskillEvaluation[]
  const skill_evaluation = parseSkillEvaluations(skill, module_skill_evaluations)

  const completed = isCompletedStep({
    id: step.id,
    questions,
    subskill_evaluations,
    skill_evaluation,
    user_module_steps,
    type: step.type,
  })

  return {
    ...step,
    title: step.title as IntlRecord,
    description: step.description as IntlRecord,
    content: step.content as IntlRecord,
    questions,
    subskill_evaluations,
    skill_evaluation,
    completed,
  }
}

export const parseSkillEvaluations = (
  skill: Skill,
  skillEvaluations: (Tables<'module_skill_evaluations'> & {
    user_skill_evaluations?: Tables<'user_skill_evaluations'>[]
  })[],
): ModuleSkillEvaluation | undefined => {
  const skillEvaluation = skillEvaluations?.at(0)
  if (!skillEvaluation) return undefined

  const { description, user_skill_evaluations, ...evaluation } = skillEvaluation
  const userEvaluation = user_skill_evaluations?.at(0)?.value

  return {
    ...evaluation,
    description: description as IntlRecord,
    user_evaluation: userEvaluation,
    skill,
  }
}

export const isCompletedStep = (
  step: Pick<ModuleStep, 'id' | 'type' | 'questions' | 'subskill_evaluations' | 'skill_evaluation'> & {
    user_module_steps: UserModuleStepsTable[]
  },
) => {
  const userStep = !!step.user_module_steps.find(userModule => userModule.module_step_id === step.id)
  if (!userStep) return false

  switch (step.type) {
    case 'questions':
      return step.questions.every(question => !!question.user_answer)
    case 'subskill_evaluations':
      return step.subskill_evaluations.every(evaluation => !!evaluation.user_evaluation)
    case 'skill_evaluation':
      return !!step.skill_evaluation?.user_evaluation
    default:
      return true
  }
}
