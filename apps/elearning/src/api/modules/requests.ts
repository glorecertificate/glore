import { getDB } from '@/services/db'

import { mapBaseModule, mapModule } from './utils'

export const fetchAllModules = async () => {
  const db = await getDB()

  const { data, error } = await db.from('modules').select(
    `
      *,
      skills (
        *,
        subskills (
          *
        )
      ),
      module_steps(count)
    `,
  )

  if (error || !data) {
    if (error) console.error(error)
    return []
  }

  return data.map(module => mapBaseModule(module))
}

export const fetchModule = async (slug: string) => {
  const db = await getDB()

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
          module_questions (
            *
          ),
          module_subskill_evaluations (
            *,
            subskill:subskill_id (
              *
            )
          ),
          module_skill_evaluations (
            *,
            skill:skill_id (
              *
            )
          )
        )
      `,
    )
    .eq('skills.slug', slug)
    .single()

  if (!data) {
    if (error) console.error(error)
    return null
  }

  return mapModule(data)
}
