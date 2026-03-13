'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache, createElement } from 'react'

import { put } from '@vercel/blob'
import { and, asc, count, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { listCourses } from '@/actions/course'
import { getActiveOrgId } from '@/actions/user'
import { type CertificateFormValues, type ReviewCertificateValues } from '@/components/features/certificates/schemas'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { certificateSkills, certificates, memberships, users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'
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

export const listUserCertificates = async (): Promise<{ data: Certificate[] | null; error: unknown }> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
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

export const listTutorCertificates = async (): Promise<{ data: Certificate[] | null; error: unknown }> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
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
    if (updated) revalidateTag(CacheTag.Certificates, 'max')
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

    let documentUrl: string | undefined
    if (isApprove) {
      const volunteerName = cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : ''
      const skillNames = cert.skills.map(s => {
        if (!s.course.title) return s.course.slug
        const titleMap = s.course.title as Record<string, string>
        return titleMap[cert.language] ?? titleMap[i18n.defaultLocale] ?? s.course.slug
      })
      const { renderToBuffer } = await import('@react-pdf/renderer')
      const { CertificateDocument } = await import('@/components/features/certificates/document')
      const pdfBuffer = await renderToBuffer(
        createElement(CertificateDocument, {
          values: {
            activityStartDate: cert.activityStartDate,
            activityEndDate: cert.activityEndDate,
            activityDuration: cert.activityDuration,
            activityLocation: cert.activityLocation,
            activityDescription: cert.activityDescription,
            organizationRating: cert.organizationRating,
          },
          volunteerName,
          orgName: cert.organization.name,
          orgLogoUrl: cert.organization.avatarUrl,
          skillNames,
          issuedDate: issuedAt,
        }) as Parameters<typeof renderToBuffer>[0]
      )
      const blob = await put(`certificates/${cert.handle}.pdf`, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      })
      documentUrl = blob.url
    }

    const [updated] = await db
      .update(certificates)
      .set(
        isApprove
          ? { status: 'approved', issuedAt, documentUrl }
          : { status: 'changes_requested', reviewerComment: 'comment' in values ? values.comment : undefined }
      )
      .where(eq(certificates.id, id))
      .returning()

    revalidateTag(CacheTag.Certificates, 'max')

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

    revalidateTag(CacheTag.Certificates, 'max')

    if (reviewerId) {
      const [reviewer] = await db.select({ email: users.email }).from(users).where(eq(users.id, reviewerId))
      if (reviewer?.email) {
        await sendMail({
          to: reviewer.email,
          template: { name: 'certificate/assigned', props: {} },
        }).catch(() => null)
      }
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
