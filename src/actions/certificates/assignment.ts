'use server'

import 'server-only'

import { z } from 'zod'

import {
  buildEvent,
  certificateAction,
  commitTransition,
  expireCertificateCaches,
  findCertificateRow,
  invalidInput,
  requireCertificateManager,
  requireRateLimitedUser,
  requireTutorRole,
} from '@/actions/certificates/helpers'
import { db } from '@/db/client'
import { CertificateError, assignCertificate, isAssignableTutor } from '@/db/mutations/certificate'
import { OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'

const idSchema = z.number().int().positive()
const tutorIdSchema = z.string().min(1).max(200)

const parse = <T>(schema: z.ZodType<T>, value: unknown) => {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw invalidInput(parsed.error)
  return parsed.data
}

const requireOpen = (status: string) => {
  if (!(OPEN_CERTIFICATE_STATUSES as readonly string[]).includes(status)) {
    throw new CertificateError('INVALID_STATE', 'Only open requests can be assigned')
  }
}

const requireAvailableTutor = async (authorId: string, organizationId: number, tutorId: string) => {
  if (tutorId === authorId) throw new CertificateError('FORBIDDEN', 'Authors cannot review their own certificate')
  if (!(await isAssignableTutor(db, { authorId, organizationId, tutorId }))) {
    throw new CertificateError('INVALID_INPUT', 'Selected user is not an available tutor in this organization')
  }
}

export const assignCertificateTutor = async (id: number, tutorId: string) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('assign', 60)
    const certificateId = parse(idSchema, id)
    const reviewerId = parse(tutorIdSchema, tutorId)

    const cert = await findCertificateRow(certificateId)
    await requireCertificateManager(authUser, cert.organizationId)
    requireOpen(cert.status)
    if (cert.reviewerId === reviewerId) throw new CertificateError('INVALID_STATE', 'Tutor is already assigned')
    await requireAvailableTutor(cert.userId, cert.organizationId, reviewerId)

    const row = await commitTransition(
      tx => assignCertificate(tx, { expected: cert, id: certificateId, reviewerId }),
      assigned =>
        buildEvent(
          'certificate.assigned',
          { actorId: authUser.id, organizationId: assigned.organizationId },
          {
            certificateId: assigned.id,
            holderId: assigned.userId,
            previousTutorId: cert.reviewerId,
            tutorId: reviewerId,
          }
        )
    )
    expireCertificateCaches(row, row.reviewerId, cert.reviewerId)
    return row
  })

export const unassignCertificate = async (id: number) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('assign', 60)
    const certificateId = parse(idSchema, id)

    const cert = await findCertificateRow(certificateId)
    if (cert.reviewerId === null) throw new CertificateError('INVALID_STATE', 'Certificate has no assigned tutor')
    if (cert.reviewerId === authUser.id) await requireTutorRole(authUser.id, cert.organizationId)
    if (cert.reviewerId !== authUser.id) await requireCertificateManager(authUser, cert.organizationId)
    requireOpen(cert.status)

    const previousTutorId = cert.reviewerId
    const row = await commitTransition(
      tx => assignCertificate(tx, { expected: cert, id: certificateId, reviewerId: null }),
      unassigned =>
        buildEvent(
          'certificate.unassigned',
          { actorId: authUser.id, organizationId: unassigned.organizationId },
          {
            certificateId: unassigned.id,
            holderId: unassigned.userId,
            previousTutorId,
          }
        )
    )
    expireCertificateCaches(row, previousTutorId)
    return row
  })

export const selfAssignCertificate = async (id: number) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('assign', 60)
    const certificateId = parse(idSchema, id)

    const cert = await findCertificateRow(certificateId)
    await requireTutorRole(authUser.id, cert.organizationId)
    if (cert.userId === authUser.id) {
      throw new CertificateError('FORBIDDEN', 'Authors cannot review their own certificate')
    }
    if (cert.status !== 'submitted') {
      throw new CertificateError('INVALID_STATE', 'Certificate cannot be claimed at this stage')
    }
    if (cert.reviewerId !== null) {
      throw new CertificateError('CONFLICT', 'Certificate already has an assigned reviewer')
    }
    await requireAvailableTutor(cert.userId, cert.organizationId, authUser.id)

    const row = await commitTransition(
      tx => assignCertificate(tx, { expected: cert, id: certificateId, reviewerId: authUser.id }),
      assigned =>
        buildEvent(
          'certificate.assigned',
          { actorId: authUser.id, organizationId: assigned.organizationId },
          {
            certificateId: assigned.id,
            holderId: assigned.userId,
            previousTutorId: null,
            tutorId: authUser.id,
          }
        )
    )
    expireCertificateCaches(row, authUser.id)
    return row
  })
