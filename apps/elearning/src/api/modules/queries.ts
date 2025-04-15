import { getDB } from '@/services/db'

export type ModuleRecord = NonNullable<Awaited<ReturnType<typeof selectModule>>['data']>[0]

export const selectModuleQuery = `
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
`

export const selectModule = async () => await (await getDB()).from('modules').select(selectModuleQuery)
