'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificateWithUsers } from '@/actions/certificates/helpers'
import { createNotification } from '@/actions/notification'
import { getActiveOrgId } from '@/actions/user'
import { generateCertificatePdf } from '@/components/features/certificates/generate-pdf'
import {
  type CertificateFormValues,
  type DraftCertificateValues,
  type ResubmitCertificateValues,
  type ReviewCertificateValues,
} from '@/components/features/certificates/schemas'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { certificateSkills, certificates, memberships, users } from '@/db/schema'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'
import { checkRateLimit } from '@/lib/rate-limit'
import { r2Put } from '@/lib/storage'

export const claimCertificateReview = async (id: number) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const [updated] = await db
      .update(certificates)
      .set({ status: 'in_review' })
      .where(
        and(eq(certificates.id, id), eq(certificates.reviewerId, authUser.id), eq(certificates.status, 'submitted'))
      )
      .returning()
    return updated ?? null
  })
}

export const reviewCertificate = async (id: number, values: ReviewCertificateValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const rl = checkRateLimit(`review-cert:${authUser.id}`, 10, 60 * 60 * 1000)
  if (rl.limited) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many certificate reviews. Try again later.' } }
  }

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: and(eq(certificates.id, id), eq(certificates.reviewerId, authUser.id)),
      with: certificateWithUsers,
    })
    if (!cert) throw new Error('Certificate not found or not assigned to you')

    const isApprove = values.action === 'approve'
    const issuedAt = new Date().toISOString()

    const activityStartDate = values.activityStartDate ?? cert.activityStartDate
    const activityEndDate = values.activityEndDate ?? cert.activityEndDate
    const activityDuration = values.activityDuration ?? cert.activityDuration
    const activityLocation = values.activityLocation ?? cert.activityLocation
    const activityDescription = values.activityDescription ?? cert.activityDescription

    if (values.skillCourseIds !== undefined) {
      await db.delete(certificateSkills).where(eq(certificateSkills.certificateId, id))
      if (values.skillCourseIds.length > 0) {
        await db
          .insert(certificateSkills)
          .values(values.skillCourseIds.map(courseId => ({ certificateId: id, courseId })))
      }
    }

    const skillsToMap =
      values.skillCourseIds === undefined
        ? cert.skills
        : cert.skills.filter(s => values.skillCourseIds!.includes(s.course.id))

    const skillNames = skillsToMap.map(s => {
      if (!s.course.title) return s.course.slug
      const titleMap = s.course.title as Record<string, string>
      return titleMap[cert.language] ?? titleMap[i18n.defaultLocale] ?? s.course.slug
    })

    let documentUrl: string | undefined
    if (isApprove) {
      const volunteerName = cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : ''
      const pdfBuffer = await generateCertificatePdf({
        values: {
          activityStartDate,
          activityEndDate,
          activityDuration,
          activityLocation,
          activityDescription,
          organizationRating: cert.organizationRating,
        },
        volunteerName,
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

    const [updated] = await db
      .update(certificates)
      .set(
        isApprove
          ? { ...activityUpdates, status: 'approved', issuedAt, documentUrl }
          : {
              ...activityUpdates,
              status: 'changes_requested',
              reviewerComment: 'comment' in values ? values.comment : undefined,
            }
      )
      .where(and(eq(certificates.id, id), eq(certificates.updatedAt, cert.updatedAt)))
      .returning()

    if (!updated) throw new Error('Conflict: certificate was modified by another request')

    if (isApprove) {
      const existingDefault = await db.query.certificates.findFirst({
        where: and(eq(certificates.userId, cert.userId), eq(certificates.isDefault, true)),
        columns: { id: true },
      })
      if (!existingDefault) {
        await db.update(certificates).set({ isDefault: true }).where(eq(certificates.id, id))
      }
    }

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
      await createNotification(cert.userId, 'certificate_reviewed', {
        certificateId: id,
        status: isApprove ? 'approved' : 'changes_requested',
      }).catch(() => null)
    }

    return updated
  })
}

export const createCertificate = async (
  values: CertificateFormValues | DraftCertificateValues,
  { draft = false } = {}
) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const orgId = await getActiveOrgId()
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  const rl = checkRateLimit(`create-cert:${authUser.id}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many certificates submitted. Try again later.' } }
  }

  return await safeQuery(async () => {
    const handle = `${authUser.id}-${orgId}-${Date.now()}`
    const status = draft ? 'draft' : 'submitted'

    let reviewerId: string | null = null

    if (!draft) {
      const tutors = await db
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(and(eq(memberships.organizationId, orgId), eq(memberships.role, 'tutor')))

      if (tutors.length > 0) {
        const tutorIds = tutors.map(t => t.userId)
        const assignmentCounts = await db
          .select({ reviewerId: certificates.reviewerId, total: count() })
          .from(certificates)
          .where(and(eq(certificates.organizationId, orgId)))
          .groupBy(certificates.reviewerId)
          .orderBy(asc(count()))

        const countMap = new Map(assignmentCounts.map(r => [r.reviewerId, r.total]))
        const sorted = tutorIds.sort((a, b) => (countMap.get(a) ?? 0) - (countMap.get(b) ?? 0))
        reviewerId = sorted[0] ?? null
      }
    }

    const [newCert] = await db
      .insert(certificates)
      .values({
        handle,
        userId: authUser.id,
        organizationId: orgId,
        language: values.language,
        activityStartDate: values.activityStartDate || '',
        activityEndDate: values.activityEndDate || '',
        activityDuration: values.activityDuration || 0,
        activityLocation: values.activityLocation || '',
        activityDescription: values.activityDescription || '',
        organizationRating: values.organizationRating || 0,
        reviewerId,
        status,
      })
      .returning()

    if (!newCert) throw new Error('Failed to create certificate')

    const skillCourseIds = values.skillCourseIds ?? []
    if (skillCourseIds.length > 0) {
      await db.insert(certificateSkills).values(
        skillCourseIds.map(courseId => ({
          certificateId: newCert.id,
          courseId,
        }))
      )
    }

    if (!draft && reviewerId) {
      const [reviewer] = await db.select({ email: users.email }).from(users).where(eq(users.id, reviewerId))
      if (reviewer?.email) {
        await sendMail({
          to: reviewer.email,
          template: { name: 'certificate/assigned', props: {} },
        }).catch(() => null)
      }
      await createNotification(reviewerId, 'certificate_assigned', {
        certificateId: newCert.id,
      }).catch(() => null)
    }

    revalidateTag(certificatesUserTag(authUser.id), 'max')
    revalidateTag(certificatesOrgTag(orgId), 'max')
    if (reviewerId) {
      revalidateTag(certificatesTutorTag(reviewerId), 'max')
    }

    return newCert
  })
}

export const resubmitCertificate = async (id: number, values: ResubmitCertificateValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const rl = checkRateLimit(`resubmit-cert:${authUser.id}`, 10, 60 * 60 * 1000)
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
      columns: { id: true, organizationId: true, reviewerId: true, status: true },
    })
    if (!cert) throw new Error('Certificate not found')
    if (cert.status === 'approved') throw new Error('Cannot reassign an approved certificate')

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

    if (reviewerId) {
      const tutorMembership = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.userId, reviewerId),
          eq(memberships.organizationId, cert.organizationId),
          eq(memberships.role, 'tutor')
        ),
        columns: { id: true },
      })
      if (!tutorMembership) throw new Error('Selected user is not a tutor in this organization')
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
      await createNotification(reviewerId, 'certificate_assigned', {
        certificateId: certId,
      }).catch(() => null)
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
      columns: { id: true, organizationId: true, reviewerId: true, status: true },
    })
    if (!cert) throw new Error('Certificate not found')
    if (cert.reviewerId !== null) throw new Error('Certificate already has an assigned reviewer')
    if (cert.status !== 'submitted') throw new Error('Certificate cannot be claimed at this stage')

    const membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, authUser.id),
        eq(memberships.organizationId, cert.organizationId),
        eq(memberships.role, 'tutor')
      ),
      columns: { id: true },
    })
    if (!membership) throw new Error('Not a tutor in this organization')

    const [updated] = await db
      .update(certificates)
      .set({ reviewerId: authUser.id })
      .where(and(eq(certificates.id, certId), isNull(certificates.reviewerId)))
      .returning()
    if (!updated) throw new Error('Certificate was already claimed by another tutor')

    revalidateTag(certificatesTutorTag(authUser.id), 'max')
    revalidateTag(certificatesOrgTag(cert.organizationId), 'max')

    return updated
  })
}
