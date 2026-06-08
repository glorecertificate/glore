import 'server-only'

import { and, eq } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { certificateSkills, certificates } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'

export const createCertificateWithSkills = async (
  tx: Transaction,
  values: TableInsert<'certificates'>,
  skillCourseIds: number[]
) => {
  const [created] = await tx.insert(certificates).values(values).returning()
  if (!created) throw new Error('Failed to create certificate')

  if (skillCourseIds.length > 0) {
    await tx.insert(certificateSkills).values(skillCourseIds.map(courseId => ({ certificateId: created.id, courseId })))
  }

  return created
}

interface ApplyCertificateReviewParams {
  id: number
  expectedUpdatedAt: string
  userId: string
  updates: TableUpdate<'certificates'>
  skillCourseIds?: number[]
  setDefaultIfNone: boolean
}

export const applyCertificateReview = async (
  tx: Transaction,
  { id, expectedUpdatedAt, userId, updates, skillCourseIds, setDefaultIfNone }: ApplyCertificateReviewParams
) => {
  if (skillCourseIds !== undefined) {
    await tx.delete(certificateSkills).where(eq(certificateSkills.certificateId, id))
    if (skillCourseIds.length > 0) {
      await tx.insert(certificateSkills).values(skillCourseIds.map(courseId => ({ certificateId: id, courseId })))
    }
  }

  const [updated] = await tx
    .update(certificates)
    .set(updates)
    .where(and(eq(certificates.id, id), eq(certificates.updatedAt, expectedUpdatedAt)))
    .returning()
  if (!updated) throw new Error('Conflict: certificate was modified by another request')

  if (setDefaultIfNone) {
    const existingDefault = await tx.query.certificates.findFirst({
      where: and(eq(certificates.userId, userId), eq(certificates.isDefault, true)),
      columns: { id: true },
    })
    if (!existingDefault) {
      await tx.update(certificates).set({ isDefault: true }).where(eq(certificates.id, id))
    }
  }

  return updated
}
