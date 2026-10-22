import 'server-only'

import { and, eq, inArray, ne, sql } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { certificateSkills, certificates, organizationRatings } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'

export const createCertificateWithSkills = async (
  tx: Transaction,
  values: TableInsert<'certificates'>,
  { organizationRating, skillCourseIds }: { organizationRating?: number; skillCourseIds: number[] }
) => {
  const lockKey = `certificate:${values.userId}:${values.organizationId}`
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`)

  const existing = await tx.query.certificates.findFirst({
    where: and(
      eq(certificates.userId, values.userId),
      eq(certificates.organizationId, values.organizationId),
      ne(certificates.status, 'draft')
    ),
    columns: { id: true },
  })
  if (existing) throw new Error('A certificate already exists for this organization')

  const drafts = await tx
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, values.userId),
        eq(certificates.organizationId, values.organizationId),
        eq(certificates.status, 'draft')
      )
    )
  const draftIds = drafts.map(({ id }) => id)
  if (draftIds.length > 0) {
    await tx.delete(certificateSkills).where(inArray(certificateSkills.certificateId, draftIds))
    await tx.delete(certificates).where(inArray(certificates.id, draftIds))
  }

  const [created] = await tx.insert(certificates).values(values).returning()
  if (!created) throw new Error('Failed to create certificate')

  if (skillCourseIds.length > 0) {
    await tx.insert(certificateSkills).values(skillCourseIds.map(courseId => ({ certificateId: created.id, courseId })))
  }

  if (organizationRating && organizationRating >= 1 && organizationRating <= 5) {
    await tx
      .insert(organizationRatings)
      .values({ certificateId: created.id, experience: organizationRating, organizationId: created.organizationId })
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
