'use server'

import 'server-only'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  buildEvent,
  certificateAction,
  commitTransition,
  expireCertificateCaches,
  findCertificateRow,
  invalidInput,
  requireAssignedTutor,
  requireManagedCertificate,
  requireRateLimitedUser,
} from '@/actions/certificates/helpers'
import { certificateSnapshot, findCertificatePdfSource, renderCertificatePdf } from '@/actions/certificates/pdf'
import { notify } from '@/actions/notifications/notify'
import { generateCertificateCode, meetsActivityRule } from '@/components/features/certificates/rules'
import {
  type CertificateApprovalValues,
  type CertificateChangesValues,
  type CertificateReasonValues,
  MIN_ISSUED_LEVEL,
  certificateApprovalSchema,
  certificateChangesSchema,
  certificateReasonSchema,
} from '@/components/features/certificates/schemas'
import { db, transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import {
  CertificateError,
  recordCertificateApproval,
  recordCertificateChanges,
  recordCertificateRejection,
  recordCertificateRevocation,
  revertCertificateApproval,
  startCertificateReview,
} from '@/db/mutations/certificate'
import { certificateSkills, certificates } from '@/db/schema'
import { r2DeleteQuietly, r2Put } from '@/lib/storage'
import appConfig from '~/config/app.json'

const idSchema = z.number().int().positive()

const parse = <T>(schema: z.ZodType<T>, value: unknown) => {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw invalidInput(parsed.error)
  return parsed.data
}

export const claimCertificateReview = async (id: number) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('review', 120)
    const certificateId = parse(idSchema, id)

    await requireAssignedTutor(authUser.id, await findCertificateRow(certificateId))
    const row = await commitTransition(
      tx => startCertificateReview(tx, { id: certificateId, reviewerId: authUser.id }),
      claimed =>
        buildEvent(
          'certificate.claimed',
          { actorId: authUser.id, organizationId: claimed.organizationId },
          {
            certificateId: claimed.id,
            holderId: claimed.userId,
            tutorId: authUser.id,
          }
        )
    )
    expireCertificateCaches(row, authUser.id)
    return row
  })

export const requestCertificateChanges = async (id: number, input: CertificateChangesValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('review', 120)
    const certificateId = parse(idSchema, id)
    const values = parse(certificateChangesSchema, input)

    await requireAssignedTutor(authUser.id, await findCertificateRow(certificateId))
    const sectionComments = Object.fromEntries(Object.entries(values.sectionComments ?? {}).filter(([, text]) => text))
    const row = await commitTransition(
      tx =>
        recordCertificateChanges(tx, {
          comment: values.comment,
          id: certificateId,
          reviewerId: authUser.id,
          sectionComments,
        }),
      requested =>
        buildEvent(
          'certificate.changes_requested',
          { actorId: authUser.id, organizationId: requested.organizationId },
          {
            certificateId: requested.id,
            comment: values.comment || null,
            holderId: requested.userId,
            tutorId: authUser.id,
          }
        )
    )
    expireCertificateCaches(row, authUser.id)
    return row
  })

export const rejectCertificate = async (id: number, input: CertificateReasonValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('review', 120)
    const certificateId = parse(idSchema, id)
    const { reason } = parse(certificateReasonSchema, input)

    await requireAssignedTutor(authUser.id, await findCertificateRow(certificateId))
    const row = await commitTransition(
      tx => recordCertificateRejection(tx, { id: certificateId, reason, reviewerId: authUser.id }),
      rejected =>
        buildEvent(
          'certificate.rejected',
          { actorId: authUser.id, organizationId: rejected.organizationId },
          {
            certificateId: rejected.id,
            holderId: rejected.userId,
            reason,
          }
        )
    )
    expireCertificateCaches(row, authUser.id)
    return row
  })

export const revokeCertificate = async (id: number, input: CertificateReasonValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('revoke', 20)
    const certificateId = parse(idSchema, id)
    const { reason } = parse(certificateReasonSchema, input)

    await requireManagedCertificate(authUser, certificateId)
    const row = await commitTransition(
      tx => recordCertificateRevocation(tx, { id: certificateId, reason, revokedById: authUser.id }),
      revoked =>
        buildEvent(
          'certificate.revoked',
          { actorId: authUser.id, organizationId: revoked.organizationId },
          {
            certificateId: revoked.id,
            holderId: revoked.userId,
            reason,
          }
        )
    )
    expireCertificateCaches(row, row.reviewerId)
    return row
  })

type PdfSource = NonNullable<Awaited<ReturnType<typeof findCertificatePdfSource>>>

interface SkillPick {
  courseId: number
  level?: number
  statement?: string | null
}

const issuedSkills = (source: PdfSource, requested: SkillPick[] | undefined) => {
  const stored = new Map(source.skills.map(skill => [skill.courseId, skill]))
  const picks: SkillPick[] =
    requested ?? source.skills.toSorted((a, b) => a.sortOrder - b.sortOrder).map(({ courseId }) => ({ courseId }))
  if (new Set(picks.map(({ courseId }) => courseId)).size !== picks.length) {
    throw new CertificateError('INVALID_INPUT', 'Skills must not repeat')
  }
  if (picks.length < appConfig.minSkills || picks.length > appConfig.maxSkills) {
    throw new CertificateError(
      'INVALID_INPUT',
      `A certificate needs ${appConfig.minSkills} to ${appConfig.maxSkills} skills`
    )
  }

  return picks.map((pick, index) => {
    const skill = stored.get(pick.courseId)
    if (!skill) throw new CertificateError('INVALID_INPUT', 'Skills must belong to the certificate')
    const level = pick.level ?? skill.level ?? skill.selfLevel
    if (!level || level < MIN_ISSUED_LEVEL) {
      throw new CertificateError('INVALID_INPUT', 'Skill levels on an issued certificate must be between 2 and 5')
    }
    const statement = pick.statement === undefined ? skill.statement : pick.statement || null
    return { ...skill, level, sortOrder: index, statement }
  })
}

const prepareApproval = async (certificateId: number, values: CertificateApprovalValues) => {
  const source = await findCertificatePdfSource(certificateId)
  if (!source) throw new CertificateError('NOT_FOUND', 'Certificate not found')

  const experience = {
    activityDescription: values.activityDescription ?? source.activityDescription,
    activityDuration: values.activityDuration ?? source.activityDuration,
    activityEndDate: values.activityEndDate ?? source.activityEndDate,
    activityLocation: values.activityLocation ?? source.activityLocation,
    activityStartDate: values.activityStartDate ?? source.activityStartDate,
    tasks: values.tasks ?? source.tasks,
  }
  if (experience.activityEndDate < experience.activityStartDate) {
    throw new CertificateError('INVALID_INPUT', 'The end date must not precede the start date')
  }
  if (experience.tasks.length === 0) throw new CertificateError('INVALID_INPUT', 'A certificate needs a task')
  if (!meetsActivityRule(experience)) {
    throw new CertificateError('ACTIVITY_TOO_SHORT', 'The activity is too short for a certificate')
  }

  const skills = issuedSkills(source, values.skills)
  const issuedAt = new Date().toISOString()
  const code = source.code ?? generateCertificateCode()
  const snapshot = certificateSnapshot({ ...source, ...experience, skills }, issuedAt)
  return { code, experience, issuedAt, skills, snapshot, source }
}

const requireReviewable = (cert: { status: string }) => {
  if (cert.status !== 'submitted' && cert.status !== 'in_review') {
    throw new CertificateError('INVALID_STATE', 'Certificate cannot be approved at this stage')
  }
}

export const previewCertificatePdf = async (id: number, input: CertificateApprovalValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('preview', 60)
    const certificateId = parse(idSchema, id)
    const values = parse(certificateApprovalSchema, input)

    const cert = await findCertificateRow(certificateId)
    await requireAssignedTutor(authUser.id, cert)
    requireReviewable(cert)

    const { code, snapshot } = await prepareApproval(certificateId, values)
    const pdf = await renderCertificatePdf(snapshot, code)
    return { pdf: pdf.toString('base64') }
  })

export const approveCertificate = async (id: number, input: CertificateApprovalValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('review', 120)
    const certificateId = parse(idSchema, id)
    const values = parse(certificateApprovalSchema, input)

    const cert = await findCertificateRow(certificateId)
    await requireAssignedTutor(authUser.id, cert)
    requireReviewable(cert)

    const { code, experience, issuedAt, skills, snapshot, source } = await prepareApproval(certificateId, values)
    const pdf = await renderCertificatePdf(snapshot, code)

    const backup = {
      certificate: source,
      skills: await db.query.certificateSkills.findMany({ where: eq(certificateSkills.certificateId, certificateId) }),
    }

    const approvedEvent = (
      issued: { id: number; organizationId: number; userId: string },
      documentUrl: string | null
    ) =>
      buildEvent(
        'certificate.approved',
        { actorId: authUser.id, organizationId: issued.organizationId },
        { certificateId: issued.id, documentUrl, holderId: issued.userId, tutorId: authUser.id }
      )

    const { certificate, eventId, reviewId } = await transaction(async tx => {
      const approved = await recordCertificateApproval(tx, {
        code,
        edit: experience,
        expectedUpdatedAt: source.updatedAt,
        id: certificateId,
        issuedAt,
        review: { comment: values.comment, scores: values.scores },
        reviewerId: authUser.id,
        skills: skills.map(({ courseId, level, statement }) => ({ courseId, level, statement })),
        snapshot,
      })
      const event = await recordEvent(tx, approvedEvent(approved.certificate, null))
      return { ...approved, eventId: event.id }
    })

    const key = `certificates/${source.handle}.pdf`
    let documentUrl: string
    try {
      documentUrl = await r2Put(key, pdf, 'application/pdf')
      await db.update(certificates).set({ documentUrl }).where(eq(certificates.id, certificateId))
    } catch (error) {
      console.error('[certificates] PDF upload failed, reverting the approval', error)
      await r2DeleteQuietly(key)
      try {
        await transaction(tx => revertCertificateApproval(tx, { approvedAt: issuedAt, backup, eventId, reviewId }))
      } catch (revertError) {
        console.error('[certificates] approval revert failed', revertError)
        throw new CertificateError('STORAGE_FAILED', 'The PDF could not be stored and the approval could not be undone')
      }
      expireCertificateCaches(source, authUser.id)
      throw new CertificateError('STORAGE_FAILED', 'The PDF could not be stored. The approval was undone.')
    }

    await notify(approvedEvent(certificate, documentUrl))
    expireCertificateCaches(source, authUser.id)
    return { ...certificate, documentUrl }
  })
