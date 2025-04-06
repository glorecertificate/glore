import { getDB } from '@/services/db'

import { mapBaseModule, mapModule } from './utils'

export const fetchAll = async () => {
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

export const fetchOne = async (slug: string) => {
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
          *
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
