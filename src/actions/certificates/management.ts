'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { and, asc, count, eq, inArray, isNull, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificateWithUsers } from '@/actions/certificates/helpers'
import { getCertificateEligibility } from '@/actions/certificates/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { generateCertificatePdf } from '@/components/features/certificates/generate-pdf'
import {
  type CertificateFormValues,
  type DraftCertificateValues,
  type ResubmitCertificateValues,
  type ReviewCertificateValues,
  certificateFormSchema,
  draftCertificateSchema,
  resubmitCertificateSchema,
  reviewCertificateSchema,
} from '@/components/features/certificates/schemas'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { applyCertificateReview, createCertificateWithSkills } from '@/db/mutations/certificate'
import { certificates, memberships, users } from '@/db/schema'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { checkRateLimit } from '@/lib/rate-limit'
import { r2Put } from '@/lib/storage'
import appConfig from '~/config/app.json'

const RATE_LIMIT_WINDOW = 60 * 60 * 1000

const invalidInput = () => ({ data: null, error: { code: 'INVALID_INPUT', message: 'Invalid certificate values' } })

const isOrgTutor = async (userId: string, organizationId: number) =>
  !!(await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, organizationId),
      eq(memberships.role, 'tutor')
    ),
    columns: { id: true },
  }))

export const claimCertificateReview = async (id: number) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const [updated] = await db
      .update(certificates)
      .set({ status: 'in_review' })
      .where(
        and(
          eq(certificates.id, id),
          eq(certificates.reviewerId, authUser.id),
          ne(certificates.userId, authUser.id),
          eq(certificates.status, 'submitted')
        )
      )
      .returning()
    return updated ?? null
  })
}

export const reviewCertificate = async (id: number, input: ReviewCertificateValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const parsed = reviewCertificateSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const values = parsed.data

  const rl = await checkRateLimit(`review-cert:${authUser.id}`, 10, RATE_LIMIT_WINDOW)
  if (rl.limited) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many certificate reviews. Try again later.' } }
  }

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.id, id),
        eq(certificates.reviewerId, authUser.id),
        ne(certificates.userId, authUser.id),
        inArray(certificates.status, ['submitted', 'in_review'])
      ),
      with: certificateWithUsers,
    })
    if (!cert) throw new Error('Certificate not found or not reviewable')
    if (!(await isOrgTutor(authUser.id, cert.organizationId))) throw new Error('Not a tutor in this organization')

    const certSkillIds = new Set(cert.skills.map(s => s.course.id))
    if (values.skillCourseIds?.some(courseId => !certSkillIds.has(courseId))) {
      throw new Error('Skills must belong to the certificate')
    }

    const isApprove = values.action === 'approve'
    const issuedAt = new Date().toISOString()

    const activityStartDate = values.activityStartDate ?? cert.activityStartDate
    const activityEndDate = values.activityEndDate ?? cert.activityEndDate
    const activityDuration = values.activityDuration ?? cert.activityDuration
    const activityLocation = values.activityLocation ?? cert.activityLocation
    const activityDescription = values.activityDescription ?? cert.activityDescription

    const skillsToMap =
      values.skillCourseIds === undefined
        ? cert.skills
        : cert.skills.filter(s => values.skillCourseIds?.includes(s.course.id))

    if (isApprove && skillsToMap.length < appConfig.minSkills) throw new Error('Not enough skills to approve')
    if (!(activityStartDate && activityEndDate && activityStartDate <= activityEndDate)) {
      throw new Error('Invalid activity dates')
    }

    const skillNames = skillsToMap.map(s => {
      if (!s.course.title) return s.course.slug
      const titleMap = s.course.title as Record<string, string>
      return titleMap[cert.language] ?? titleMap[DEFAULT_LOCALE] ?? s.course.slug
    })

    let documentUrl: string | undefined
    if (isApprove) {
      const pdfBuffer = await generateCertificatePdf({
        values: {
          activityStartDate,
          activityEndDate,
          activityDuration,
          activityLocation,
          activityDescription,
        },
        volunteerName: cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : '',
        orgName: cert.organization.name,
        orgLogoUrl: cert.organization.profile?.avatarUrl,
        skillNames,
        issuedDate: issuedAt,
      })
      documentUrl = await r2Put(`certificates/${cert.handle}.pdf`, pdfBuffer, 'application/pdf')
    }

    const activityUpdates = {
      activityStartDate,
      activityEndDate,
      activityDuration,
      activityLocation,
      activityDescription,
    }

    const updated = await transaction(tx =>
      applyCertificateReview(tx, {
        id,
        expectedUpdatedAt: cert.updatedAt,
        userId: cert.userId,
        updates: isApprove
          ? { ...activityUpdates, status: 'approved', issuedAt, documentUrl }
          : {
              ...activityUpdates,
              status: 'changes_requested',
              reviewerComment: 'comment' in values ? values.comment : undefined,
            },
        skillCourseIds: values.skillCourseIds && [...new Set(values.skillCourseIds)],
        setDefaultIfNone: isApprove,
      })
    )

    if (cert.user?.email) {
      await sendMail({
        to: cert.user.email,
        template: {
          name: 'certificate/review',
          props: {
            status: isApprove ? 'approved' : 'changes_requested',
            comment: 'comment' in values ? values.comment : undefined,
            documentUrl,
            userName: cert.user.firstName ?? undefined,
          },
        },
      }).catch(() => null)
    }

    revalidateTag(certificatesTutorTag(authUser.id), 'max')
    revalidateTag(certificatesOrgTag(cert.organizationId), 'max')
    if (cert.userId) {
      revalidateTag(certificatesUserTag(cert.userId), 'max')
    }

    return updated
  })
}

export const createCertificate = async (
  input: CertificateFormValues | DraftCertificateValues,
  { draft = false } = {}
) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const parsed = (draft ? draftCertificateSchema : certificateFormSchema).safeParse(input)
  if (!(parsed.success && (LOCALES as readonly string[]).includes(parsed.data.language))) return invalidInput()
  const values = parsed.data

  const [user, orgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  const role = user.organizations.find(({ id }) => id === orgId)?.role
  if (!role || role === 'learner') return { data: null, error: { code: 'FORBIDDEN', message: 'Not allowed' } }

  const rl = await checkRateLimit(`create-cert:${authUser.id}`, 5, RATE_LIMIT_WINDOW)
  if (rl.limited) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many certificates submitted. Try again later.' } }
  }

  return await safeQuery(async () => {
    const { completedSkillCourseIds, eligible } = await getCertificateEligibility({ cache: false })
    if (!(draft || eligible)) throw new Error('Not eligible for a certificate')

    const skillCourseIds = [...new Set(values.skillCourseIds ?? [])]
    if (skillCourseIds.some(courseId => !completedSkillCourseIds.includes(courseId))) {
      throw new Error('Skills must be completed skill courses')
    }

    const handle = `${authUser.id}-${orgId}-${Date.now()}`
    const status = draft ? 'draft' : 'submitted'

    let reviewerId: string | null = null

    if (!draft) {
      const tutors = await db
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(
          and(eq(memberships.organizationId, orgId), eq(memberships.role, 'tutor'), ne(memberships.userId, authUser.id))
        )

      if (tutors.length > 0) {
        const tutorIds = tutors.map(t => t.userId)
        const assignmentCounts = await db
          .select({ reviewerId: certificates.reviewerId, total: count() })
          .from(certificates)
          .where(eq(certificates.organizationId, orgId))
          .groupBy(certificates.reviewerId)
          .orderBy(asc(count()))

        const countMap = new Map(assignmentCounts.map(r => [r.reviewerId, r.total]))
        const sorted = tutorIds.sort((a, b) => (countMap.get(a) ?? 0) - (countMap.get(b) ?? 0))
        reviewerId = sorted[0] ?? null
      }
    }

    const newCert = await transaction(tx =>
      createCertificateWithSkills(
        tx,
        {
          handle,
          userId: authUser.id,
          organizationId: orgId,
          language: values.language,
          activityStartDate: values.activityStartDate || '',
          activityEndDate: values.activityEndDate || '',
          activityDuration: values.activityDuration || 0,
          activityLocation: values.activityLocation || '',
          activityDescription: values.activityDescription || '',
          reviewerId,
          status,
        },
        { organizationRating: values.organizationRating, skillCourseIds }
      )
    )

    if (!draft && reviewerId) {
      const [reviewer] = await db.select({ email: users.email }).from(users).where(eq(users.id, reviewerId))
      if (reviewer?.email) {
        await sendMail({
          to: reviewer.email,
          template: { name: 'certificate/assigned', props: {} },
        }).catch(() => null)
      }
    }

    revalidateTag(certificatesUserTag(authUser.id), 'max')
    revalidateTag(certificatesOrgTag(orgId), 'max')
    if (reviewerId) {
      revalidateTag(certificatesTutorTag(reviewerId), 'max')
    }

    return newCert
  })
}

export const resubmitCertificate = async (id: number, input: ResubmitCertificateValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const parsed = resubmitCertificateSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const values = parsed.data

  const rl = await checkRateLimit(`resubmit-cert:${authUser.id}`, 10, RATE_LIMIT_WINDOW)
  if (rl.limited) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many resubmissions. Try again later.' } }
  }

  return await safeQuery(async () => {
    const [updated] = await db
      .update(certificates)
      .set({
        status: 'submitted',
        reviewerComment: null,
        activityStartDate: values.activityStartDate,
        activityEndDate: values.activityEndDate,
        activityDuration: values.activityDuration,
        activityLocation: values.activityLocation,
        activityDescription: values.activityDescription,
      })
      .where(
        and(eq(certificates.id, id), eq(certificates.userId, authUser.id), eq(certificates.status, 'changes_requested'))
      )
      .returning()
    if (!updated) throw new Error('Certificate not found or cannot be resubmitted')

    revalidateTag(certificatesUserTag(authUser.id), 'max')
    if (updated.reviewerId) {
      revalidateTag(certificatesTutorTag(updated.reviewerId), 'max')
    }
    if (updated.organizationId) {
      revalidateTag(certificatesOrgTag(updated.organizationId), 'max')
    }

    return updated
  })
}

export const assignCertificateTutor = async (certId: number, reviewerId: string | null) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, certId),
      columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
    })
    if (!cert) throw new Error('Certificate not found')
    if (cert.status === 'approved' || cert.status === 'draft') throw new Error('Cannot reassign this certificate')

    const membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, authUser.id),
        eq(memberships.organizationId, cert.organizationId),
        inArray(memberships.role, ['admin', 'representative'])
      ),
      columns: { id: true },
    })
    const isCurrentReviewer = cert.reviewerId === authUser.id
    if (!membership && !isCurrentReviewer) throw new Error('Not authorized to reassign this certificate')

    if (reviewerId === cert.userId) throw new Error('Volunteers cannot review their own certificate')
    if (reviewerId && !(await isOrgTutor(reviewerId, cert.organizationId))) {
      throw new Error('Selected user is not a tutor in this organization')
    }

    const [updated] = await db.update(certificates).set({ reviewerId }).where(eq(certificates.id, certId)).returning()

    if (reviewerId) {
      const [reviewer] = await db.select({ email: users.email }).from(users).where(eq(users.id, reviewerId))
      if (reviewer?.email) {
        await sendMail({
          to: reviewer.email,
          template: { name: 'certificate/assigned', props: {} },
        }).catch(() => null)
      }
    }

    revalidateTag(certificatesOrgTag(cert.organizationId), 'max')
    if (cert.reviewerId) {
      revalidateTag(certificatesTutorTag(cert.reviewerId), 'max')
    }
    if (reviewerId) {
      revalidateTag(certificatesTutorTag(reviewerId), 'max')
    }

    return updated
  })
}

export const selfAssignCertificate = async (certId: number) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, certId),
      columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
    })
    if (!cert) throw new Error('Certificate not found')
    if (cert.userId === authUser.id) throw new Error('Volunteers cannot review their own certificate')
    if (cert.reviewerId !== null) throw new Error('Certificate already has an assigned reviewer')
    if (cert.status !== 'submitted') throw new Error('Certificate cannot be claimed at this stage')

    if (!(await isOrgTutor(authUser.id, cert.organizationId))) throw new Error('Not a tutor in this organization')

    const [updated] = await db
      .update(certificates)
      .set({ reviewerId: authUser.id })
      .where(and(eq(certificates.id, certId), isNull(certificates.reviewerId), eq(certificates.status, 'submitted')))
      .returning()
    if (!updated) throw new Error('Certificate was already claimed by another tutor')

    revalidateTag(certificatesTutorTag(authUser.id), 'max')
    revalidateTag(certificatesOrgTag(cert.organizationId), 'max')

    return updated
  })
}
