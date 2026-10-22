'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  buildEvent,
  certificateAction,
  commitTransition,
  expireCertificateCaches,
  findAuthoredCertificate,
  invalidInput,
  membershipRole,
  requireRateLimitedUser,
} from '@/actions/certificates/helpers'
import { getCertificateEligibility } from '@/actions/certificates/queries'
import { getActiveOrgId } from '@/actions/user'
import {
  generateCertificateCode,
  meetsActivityRule,
  mergeCertificateValues,
  missingPersonalData,
} from '@/components/features/certificates/rules'
import {
  type CertificateEditValues,
  type PersonalDataValues,
  certificateEditSchema,
  certificateRequestSchema,
  personalDataSchema,
} from '@/components/features/certificates/schemas'
import { db, transaction } from '@/db/client'
import {
  CertificateError,
  createCertificateDraft,
  removeCertificateDraft,
  submitCertificateRequest,
  updateCertificateDraft,
  withdrawCertificateRequest,
} from '@/db/mutations/certificate'
import { OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'
import { users } from '@/db/schema'
import { userTag } from '@/lib/cache'

const idSchema = z.number().int().positive()

const draftInputSchema = z.object({ id: idSchema.optional(), values: certificateEditSchema })

const parseId = (id: number) => {
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) throw invalidInput(parsed.error)
  return parsed.data
}

const parsePersonal = (personal: PersonalDataValues | undefined) => {
  if (personal === undefined) return undefined
  const parsed = personalDataSchema.safeParse(personal)
  if (!parsed.success) throw invalidInput(parsed.error)
  return parsed.data
}

const requireCompletedSkills = async (courseIds: number[], { fresh }: { fresh: boolean }) => {
  const eligibility = await getCertificateEligibility({ cache: !fresh })
  const completed = new Set(eligibility.completedSkillCourseIds)
  if (courseIds.some(courseId => !completed.has(courseId))) {
    throw new CertificateError('INVALID_INPUT', 'Skills must be completed skill courses')
  }
  return eligibility
}

export const saveCertificateDraft = async (input: { id?: number; values: CertificateEditValues }) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('draft', 300)
    const parsed = draftInputSchema.safeParse(input)
    if (!parsed.success) throw invalidInput(parsed.error)
    const { id, values } = parsed.data

    if (values.skills) {
      await requireCompletedSkills(
        values.skills.map(({ courseId }) => courseId),
        { fresh: false }
      )
    }

    if (id !== undefined) {
      await findAuthoredCertificate(id, authUser.id)
      const draft = await transaction(tx => updateCertificateDraft(tx, { edit: values, id, userId: authUser.id }))
      expireCertificateCaches(draft)
      return draft
    }

    const organizationId = await getActiveOrgId()
    if (!organizationId) throw new CertificateError('FORBIDDEN', 'No active organization')
    if ((await membershipRole(authUser.id, organizationId)) !== 'volunteer') {
      throw new CertificateError('FORBIDDEN', 'Only volunteers can request certificates')
    }

    const draft = await transaction(tx =>
      createCertificateDraft(tx, { edit: values, organizationId, userId: authUser.id })
    )
    expireCertificateCaches(draft)
    return draft
  })

export const deleteCertificateDraft = async (id: number) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('draft-delete', 60)
    const certificateId = parseId(id)

    const cert = await findAuthoredCertificate(certificateId, authUser.id)
    await transaction(tx => removeCertificateDraft(tx, { id: certificateId, userId: authUser.id }))
    expireCertificateCaches(cert)
    return { id: certificateId }
  })

type AuthoredCertificate = Awaited<ReturnType<typeof findAuthoredCertificate>>

const prepareSubmission = async (
  cert: AuthoredCertificate,
  edit: CertificateEditValues,
  personal: PersonalDataValues | undefined
) => {
  const parsed = certificateRequestSchema.safeParse(mergeCertificateValues(cert, edit))
  if (!parsed.success) throw invalidInput(parsed.error)
  const values = parsed.data

  const eligibility = await requireCompletedSkills(
    values.skills.map(({ courseId }) => courseId),
    { fresh: true }
  )
  if (!eligibility.eligible) throw new CertificateError('NOT_ELIGIBLE', 'Not eligible for a certificate')
  if (!meetsActivityRule(values)) {
    throw new CertificateError('ACTIVITY_TOO_SHORT', 'The activity is too short for a certificate')
  }

  const holder = await db.query.users.findFirst({
    columns: { birthPlace: true, birthday: true, lastName: true, nationality: true },
    where: eq(users.id, cert.userId),
  })
  const missing = missingPersonalData({ ...holder, ...personal })
  if (missing.length > 0) {
    throw new CertificateError('PERSONAL_DATA_MISSING', `Missing personal data: ${missing.join(', ')}`)
  }

  const skills = values.skills.map(skill => {
    const selfLevel = skill.selfLevel ?? eligibility.selfLevels[skill.courseId]
    if (selfLevel === undefined) {
      throw new CertificateError('INVALID_INPUT', 'Every skill needs a self-assessment level')
    }
    return { ...skill, selfLevel }
  })

  return { edit: { ...values, skills }, personal }
}

interface SubmissionParams {
  cert: AuthoredCertificate
  edit: CertificateEditValues
  from: 'changes_requested' | 'draft'
  personal: PersonalDataValues | undefined
}

const submission = async ({ cert, edit, from, personal }: SubmissionParams) => {
  if (cert.status !== from) throw new CertificateError('INVALID_STATE', 'Certificate cannot be submitted at this stage')
  if ((await membershipRole(cert.userId, cert.organizationId)) !== 'volunteer') {
    throw new CertificateError('FORBIDDEN', 'Only volunteers can request certificates')
  }

  const prepared = await prepareSubmission(cert, edit, personal)
  const { row } = await commitTransition(
    tx =>
      submitCertificateRequest(tx, {
        code: generateCertificateCode(),
        edit: prepared.edit,
        from,
        id: cert.id,
        organizationId: cert.organizationId,
        personal: prepared.personal,
        userId: cert.userId,
      }),
    ({ row: submitted }) =>
      buildEvent(
        from === 'draft' ? 'certificate.submitted' : 'certificate.resubmitted',
        { actorId: cert.userId, organizationId: submitted.organizationId },
        { certificateId: submitted.id, holderId: submitted.userId, tutorId: submitted.reviewerId }
      )
  )

  if (prepared.personal) updateTag(userTag(cert.userId))
  expireCertificateCaches(row, row.reviewerId, cert.reviewerId)
  return row
}

export const submitCertificate = async (id: number, personal?: PersonalDataValues) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('submit', 10)
    const certificateId = parseId(id)
    const personalData = parsePersonal(personal)

    return await submission({
      cert: await findAuthoredCertificate(certificateId, authUser.id),
      edit: {},
      from: 'draft',
      personal: personalData,
    })
  })

export const resubmitCertificate = async (
  id: number,
  values: CertificateEditValues = {},
  personal?: PersonalDataValues
) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('resubmit', 20)
    const certificateId = parseId(id)
    const parsed = certificateEditSchema.safeParse(values)
    if (!parsed.success) throw invalidInput(parsed.error)
    const personalData = parsePersonal(personal)

    return await submission({
      cert: await findAuthoredCertificate(certificateId, authUser.id),
      edit: parsed.data,
      from: 'changes_requested',
      personal: personalData,
    })
  })

export const withdrawCertificate = async (id: number) =>
  await certificateAction(async () => {
    const authUser = await requireRateLimitedUser('withdraw', 20)
    const certificateId = parseId(id)

    const cert = await findAuthoredCertificate(certificateId, authUser.id)
    if (!(OPEN_CERTIFICATE_STATUSES as readonly string[]).includes(cert.status)) {
      throw new CertificateError('INVALID_STATE', 'Only open requests can be withdrawn')
    }

    const row = await commitTransition(
      tx => withdrawCertificateRequest(tx, { id: certificateId, userId: authUser.id }),
      withdrawn =>
        buildEvent(
          'certificate.withdrawn',
          { actorId: authUser.id, organizationId: withdrawn.organizationId },
          {
            certificateId: withdrawn.id,
            holderId: withdrawn.userId,
            tutorId: withdrawn.reviewerId,
          }
        )
    )
    expireCertificateCaches(row, row.reviewerId)
    return row
  })
