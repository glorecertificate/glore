import 'server-only'

import { eq } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { skillGroups } from '@/db/schema'

export const renumberSkillGroups = async (tx: Transaction, orderedIds: number[]) => {
  await mapSequential(orderedIds, async id => {
    const index = orderedIds.indexOf(id)
    await tx
      .update(skillGroups)
      .set({ sortOrder: index + 1 })
      .where(eq(skillGroups.id, id))
  })
}
