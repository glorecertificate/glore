'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache, createElement } from 'react'

import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { listCourses } from '@/actions/course'
import { createNotification } from '@/actions/notification'
import { getActiveOrgId } from '@/actions/user'
import {
  type CertificateFormValues,
  type ResubmitCertificateValues,
  type ReviewCertificateValues,
} from '@/components/features/certificates/schemas'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { certificateSkills, certificates, memberships, users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'
import { r2Put } from '@/lib/storage'
import appConfig from '~/config/app.json'

const certificateUserColumns = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
} as const

const certificateWith = {
  organization: {
    columns: { id: true, handle: true, name: true, city: true, country: true, avatarUrl: true },
  },
  skills: {
    with: {
      course: { columns: { id: true, slug: true, title: true } },
    },
  },
} as const

const certificateWithUsers = {
  ...certificateWith,
  user: { columns: certificateUserColumns },
  reviewer: { columns: certificateUserColumns },
} as const

const fetchUserCertificates = cache(async (userId: string) => {
  'use cache'
  cacheTag(CacheTag.Certificates)
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: certificateWith,
      orderBy: (certs, { desc }) => [desc(certs.createdAt)],
    })
    return result.map(parseCertificate)
  })
})

export const listUserCertificates = async ({ cache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  if (!cache) {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.userId, authUser.id),
      with: certificateWith,
      orderBy: (certs, { desc }) => [desc(certs.createdAt)],
    })
    return { data: result.map(parseCertificate), error: null }
  }
  return await fetchUserCertificates(authUser.id)
}

const fetchTutorCertificates = cache(async (reviewerId: string) => {
  'use cache'
  cacheTag(CacheTag.Certificates)
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.reviewerId, reviewerId),
      with: certificateWithUsers,
      orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
    })
    return result.map(parseCertificate)
  })
})

export const listTutorCertificates = async ({ cache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  if (!cache) {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.reviewerId, authUser.id),
      with: certificateWithUsers,
      orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
    })
    return { data: result.map(parseCertificate), error: null }
  }
  return await fetchTutorCertificates(authUser.id)
}

export const findCertificate = async (id: number) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
      with: certificateWithUsers,
    })
    if (!cert) throw new Error('Certificate not found')
    return parseCertificate(cert)
  })
}

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
      const { renderToBuffer } = await import('@react-pdf/renderer')
      const { CertificateDocument } = await import('@/components/features/certificates/document')
      const pdfBuffer = await renderToBuffer(
        createElement(CertificateDocument, {
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
          orgLogoUrl: cert.organization.avatarUrl,
          skillNames,
          issuedDate: issuedAt,
        }) as Parameters<typeof renderToBuffer>[0]
      )
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
      .where(eq(certificates.id, id))
      .returning()

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

    if (cert.userId) {
      await createNotification(cert.userId, 'certificate_reviewed', {
        certificateId: id,
        status: isApprove ? 'approved' : 'changes_requested',
      }).catch(() => null)
    }

    return updated
  })
}

export interface CertificateEligibility {
  eligible: boolean
  completedSkillCount: number
  minSkills: number
  minRating: number
  hasLowRatings: boolean
  avgRating: number | null
}

export const getCertificateEligibility = async (): Promise<CertificateEligibility> => {
  const { minSkills, minRating } = appConfig
  const { data: courses, error } = await listCourses()
  if (error || !courses) {
    return {
      eligible: false,
      completedSkillCount: 0,
      minSkills,
      minRating,
      hasLowRatings: false,
      avgRating: null,
    }
  }

  const completedSkillCourses = courses.filter(c => c.type === 'skill' && c.completed)
  const completedSkillCount = completedSkillCourses.length

  if (completedSkillCount === 0) {
    return { eligible: false, completedSkillCount, minSkills, minRating, hasLowRatings: false, avgRating: null }
  }

  const ratings = completedSkillCourses.flatMap(c =>
    c.lessons.flatMap(l => (l.assessment?.userRating === undefined ? [] : [l.assessment.userRating]))
  )

  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null
  const hasLowRatings = avgRating !== null && avgRating < minRating

  const eligible = completedSkillCount >= minSkills && !hasLowRatings

  return { eligible, completedSkillCount, minSkills, minRating, hasLowRatings, avgRating }
}

export const createCertificate = async (values: CertificateFormValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const orgId = await getActiveOrgId()
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  return await safeQuery(async () => {
    const handle = `${authUser.id}-${orgId}-${Date.now()}`

    // Find the tutor with the fewest assigned certificates in this org
    const tutors = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.organizationId, orgId), eq(memberships.role, 'tutor')))

    let reviewerId: string | null = null

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

    const [newCert] = await db
      .insert(certificates)
      .values({
        handle,
        userId: authUser.id,
        organizationId: orgId,
        language: values.language,
        activityStartDate: values.activityStartDate,
        activityEndDate: values.activityEndDate,
        activityDuration: values.activityDuration,
        activityLocation: values.activityLocation,
        activityDescription: values.activityDescription,
        organizationRating: values.organizationRating,
        reviewerId,
        status: 'submitted',
      })
      .returning()

    if (!newCert) throw new Error('Failed to create certificate')

    await db.insert(certificateSkills).values(
      values.skillCourseIds.map(courseId => ({
        certificateId: newCert.id,
        courseId,
      }))
    )

    if (reviewerId) {
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

    return newCert
  })
}

export const findPublicCertificate = async (username: string, handle?: string) =>
  await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.username, username),
    })
    if (!user) throw new Error('User not found')

    const cert = await db.query.certificates.findFirst({
      where: handle
        ? and(eq(certificates.userId, user.id), eq(certificates.handle, handle), eq(certificates.status, 'approved'))
        : and(eq(certificates.userId, user.id), eq(certificates.isDefault, true), eq(certificates.status, 'approved')),
      with: certificateWithUsers,
    })
    if (!cert) throw new Error('Certificate not found')

    return parseCertificate(cert)
  })

export const resubmitCertificate = async (id: number, values: ResubmitCertificateValues) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

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

    return updated
  })
}

const fetchUnassignedOrgCertificates = cache(async (orgId: number) => {
  'use cache'
  cacheTag(CacheTag.Certificates)
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: and(
        eq(certificates.organizationId, orgId),
        isNull(certificates.reviewerId),
        eq(certificates.status, 'submitted')
      ),
      with: certificateWithUsers,
      orderBy: (c, { asc: byAsc }) => [byAsc(c.createdAt)],
    })
    return result.map(parseCertificate)
  })
})

export const listUnassignedOrgCertificates = async ({ cache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const orgId = await getActiveOrgId()
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  if (!cache) {
    const result = await db.query.certificates.findMany({
      where: and(
        eq(certificates.organizationId, orgId),
        isNull(certificates.reviewerId),
        eq(certificates.status, 'submitted')
      ),
      with: certificateWithUsers,
      orderBy: (c, { asc: byAsc }) => [byAsc(c.createdAt)],
    })
    return { data: result.map(parseCertificate), error: null }
  }
  return await fetchUnassignedOrgCertificates(orgId)
}
