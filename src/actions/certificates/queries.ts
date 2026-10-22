'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificateOwnerWith, certificatePublicWith, certificateWithUsers } from '@/actions/certificates/helpers'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import {
  activityEvents,
  assessments,
  certificateReviews,
  certificates,
  lessons,
  userAssessments,
  userCourses,
  users,
} from '@/db/schema'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import appConfig from '~/config/app.json'

const fetchUserCertificates = cache(async (userId: string) => {
  'use cache'
  cacheTag(certificatesUserTag(userId))
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: certificateOwnerWith,
      orderBy: (certs, { desc }) => [desc(certs.createdAt)],
      limit: 500,
    })
    return result.map(parseCertificate)
  })
})

export const listUserCertificates = async ({ cache: useCache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  if (!useCache) {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.userId, authUser.id),
      with: certificateOwnerWith,
      orderBy: (certs, { desc }) => [desc(certs.createdAt)],
      limit: 500,
    })
    return { data: result.map(parseCertificate), error: null }
  }
  return await fetchUserCertificates(authUser.id)
}

const queryTutorCertificates = async (reviewerId: string, organizationId: number) => {
  const result = await db.query.certificates.findMany({
    where: and(
      eq(certificates.reviewerId, reviewerId),
      eq(certificates.organizationId, organizationId),
      ne(certificates.userId, reviewerId),
      ne(certificates.status, 'draft')
    ),
    with: certificateWithUsers,
    orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
    limit: 500,
  })
  return result.map(parseCertificate)
}

const fetchTutorCertificates = cache(async (reviewerId: string, organizationId: number) => {
  'use cache'
  cacheTag(certificatesTutorTag(reviewerId))
  cacheLife('max')

  return await safeQuery(() => queryTutorCertificates(reviewerId, organizationId))
})

export const listTutorCertificates = async ({ cache: useCache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const [user, orgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (!orgId) return { data: [], error: null }

  const role = user.organizations.find(({ id }) => id === orgId)?.role
  if (role !== 'tutor') return { data: [], error: null }

  if (!useCache) return { data: await queryTutorCertificates(authUser.id, orgId), error: null }
  return await fetchTutorCertificates(authUser.id, orgId)
}

interface Viewer {
  id: string
  isAdmin: boolean
  organizations: { id: number; role: string }[]
}

const canViewCertificate = (
  user: Viewer,
  cert: { organizationId: number; reviewerId: string | null; status: string; userId: string }
) => {
  const role = user.organizations.find(({ id: orgId }) => orgId === cert.organizationId)?.role
  const isOwner = cert.userId === user.id
  if (cert.status === 'draft') return isOwner
  const isManager = role === 'admin' || role === 'representative'
  const isReviewer = cert.reviewerId === user.id
  const isPoolTutor = role === 'tutor' && cert.reviewerId === null && cert.status === 'submitted'
  return isOwner || isManager || isReviewer || isPoolTutor || user.isAdmin
}

export const findCertificate = async (id: number) => {
  const user = await getCurrentUser()

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
      with: { ...certificateWithUsers, rating: true },
    })
    if (!cert || !canViewCertificate(user, cert)) throw new Error('Certificate not found')

    const parsed = parseCertificate(cert)
    return cert.userId === user.id ? parsed : { ...parsed, rating: null }
  })
}

export interface CertificateActivityEvent {
  action: string
  actor: { firstName: string; lastName: string | null } | null
  comment: string | null
  createdAt: string
  id: number
  reason: string | null
  tutor: { firstName: string; lastName: string | null } | null
}

export interface CertificateReviewNotes {
  comment: string | null
  createdAt: string
  decision: 'approved' | 'changes_requested' | 'rejected'
  sectionComments: Partial<Record<'experience' | 'personal' | 'skills' | 'tasks', string>>
}

const metadataText = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== 'object') return null
  const value = Reflect.get(metadata, key)
  return typeof value === 'string' && value ? value : null
}

export const findCertificateActivity = async (id: number) => {
  const user = await getCurrentUser()

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
      where: eq(certificates.id, id),
    })
    if (!cert || !canViewCertificate(user, cert)) throw new Error('Certificate not found')

    const [rows, reviews] = await Promise.all([
      db
        .select({
          action: activityEvents.action,
          actorFirstName: users.firstName,
          actorLastName: users.lastName,
          createdAt: activityEvents.createdAt,
          id: activityEvents.id,
          metadata: activityEvents.metadata,
        })
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorId))
        .where(and(eq(activityEvents.subjectType, 'certificate'), eq(activityEvents.subjectId, String(id))))
        .orderBy(asc(activityEvents.createdAt), asc(activityEvents.id)),
      db.query.certificateReviews.findMany({
        columns: { comment: true, createdAt: true, decision: true, sectionComments: true },
        orderBy: (review, { desc: byDesc }) => [byDesc(review.createdAt)],
        where: and(eq(certificateReviews.certificateId, id), ne(certificateReviews.decision, 'approved')),
      }),
    ])

    const tutorIds = [...new Set(rows.flatMap(({ metadata }) => metadataText(metadata, 'tutorId') ?? []))]
    const tutors =
      tutorIds.length > 0
        ? await db
            .select({ firstName: users.firstName, id: users.id, lastName: users.lastName })
            .from(users)
            .where(inArray(users.id, tutorIds))
        : []
    const tutorById = new Map(tutors.map(({ id: tutorId, ...name }) => [tutorId, name]))

    const events: CertificateActivityEvent[] = rows.map(row => {
      const tutorId = metadataText(row.metadata, 'tutorId')
      return {
        action: row.action,
        actor: row.actorFirstName ? { firstName: row.actorFirstName, lastName: row.actorLastName } : null,
        comment: metadataText(row.metadata, 'comment'),
        createdAt: row.createdAt,
        id: row.id,
        reason: metadataText(row.metadata, 'reason'),
        tutor: tutorId ? (tutorById.get(tutorId) ?? null) : null,
      }
    })
    const [latest] = reviews
    const review: CertificateReviewNotes | null = latest
      ? {
          comment: latest.comment,
          createdAt: latest.createdAt,
          decision: latest.decision,
          sectionComments: latest.sectionComments,
        }
      : null
    return { events, review }
  })
}

export const findPublicCertificate = async (username: string) =>
  await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      columns: { id: true, publicProfile: true },
      where: eq(users.username, username),
    })
    if (!user?.publicProfile) throw new Error('User not found')

    const cert = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.userId, user.id),
        eq(certificates.isDefault, true),
        eq(certificates.status, 'approved')
      ),
      with: certificatePublicWith,
    })
    if (!cert) throw new Error('Certificate not found')

    return parseCertificate({ ...cert, reviewerComment: null, reviewerId: null })
  })

export interface CertificateEligibility {
  eligible: boolean
  completedSkillCount: number
  minSkills: number
  minRating: number
  hasLowRatings: boolean
  avgRating: number | null
  completedSkillCourseIds: number[]
  selfLevels: Record<number, number>
}

export const getCertificateEligibility = cache(
  async ({ cache: useCache = true } = {}): Promise<CertificateEligibility> => {
    const { minSkills, minRating } = appConfig
    const { data: courses, error } = await listCourses({ cache: useCache })
    if (error || !courses) {
      return {
        eligible: false,
        completedSkillCount: 0,
        minSkills,
        minRating,
        hasLowRatings: false,
        avgRating: null,
        completedSkillCourseIds: [],
        selfLevels: {},
      }
    }

    const completedSkillCourses = courses.filter(c => c.type === 'skill' && c.completed)
    const completedSkillCount = completedSkillCourses.length
    const completedSkillCourseIds = completedSkillCourses.map(c => c.id)

    if (completedSkillCount === 0) {
      return {
        eligible: false,
        completedSkillCount,
        minSkills,
        minRating,
        hasLowRatings: false,
        avgRating: null,
        completedSkillCourseIds,
        selfLevels: {},
      }
    }

    const courseRatings = completedSkillCourses.map(c => ({
      id: c.id,
      ratings: c.lessons.flatMap(l => (l.assessment?.userRating === undefined ? [] : [l.assessment.userRating])),
    }))
    const ratings = courseRatings.flatMap(c => c.ratings)
    const selfLevels = Object.fromEntries(
      courseRatings.flatMap(({ id, ratings: values }) =>
        values.length > 0
          ? [[id, Math.min(5, Math.max(1, Math.round(values.reduce((sum, r) => sum + r, 0) / values.length)))]]
          : []
      )
    )

    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null
    const hasLowRatings = avgRating !== null && avgRating < minRating

    const eligible = completedSkillCount >= minSkills && !hasLowRatings

    return {
      eligible,
      completedSkillCount,
      minSkills,
      minRating,
      hasLowRatings,
      avgRating,
      completedSkillCourseIds,
      selfLevels,
    }
  }
)

const queryUnassignedOrgCertificates = async (orgId: number) => {
  const result = await db.query.certificates.findMany({
    where: and(
      eq(certificates.organizationId, orgId),
      isNull(certificates.reviewerId),
      eq(certificates.status, 'submitted')
    ),
    with: certificateWithUsers,
    orderBy: (c, { asc: byAsc }) => [byAsc(c.createdAt)],
    limit: 500,
  })
  return result.map(parseCertificate)
}

const fetchUnassignedOrgCertificates = cache(async (orgId: number) => {
  'use cache'
  cacheTag(certificatesOrgTag(orgId))
  cacheLife('max')

  return await safeQuery(() => queryUnassignedOrgCertificates(orgId))
})

export const listUnassignedOrgCertificates = async ({ cache: useCache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const [user, orgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  const role = user.organizations.find(({ id }) => id === orgId)?.role
  if (!(role === 'admin' || role === 'representative' || role === 'tutor')) return { data: [], error: null }

  const { data, error } = useCache
    ? await fetchUnassignedOrgCertificates(orgId)
    : { data: await queryUnassignedOrgCertificates(orgId), error: null }
  return { data: data?.filter(({ userId }) => userId !== user.id) ?? null, error }
}

const queryOrganizationCertificates = async (organizationId: number) => {
  const result = await db.query.certificates.findMany({
    where: and(eq(certificates.organizationId, organizationId), ne(certificates.status, 'draft')),
    with: certificateWithUsers,
    orderBy: (c, { desc: byDesc }) => [byDesc(c.updatedAt)],
    limit: 500,
  })
  return result.map(parseCertificate)
}

const fetchOrganizationCertificates = cache(async (organizationId: number) => {
  'use cache'
  cacheTag(certificatesOrgTag(organizationId))
  cacheLife('max')

  return await safeQuery(() => queryOrganizationCertificates(organizationId))
})

export const listOrganizationCertificates = async (
  organizationId: number,
  { cache: useCache = true }: { cache?: boolean } = {}
): Promise<{ data: Certificate[] | null; error: unknown }> => {
  const user = await getCurrentUser()
  const role = user.organizations.find(({ id }) => id === organizationId)?.role
  if (!(user.isAdmin || role === 'admin' || role === 'representative')) return { data: [], error: null }

  if (!useCache) return { data: await queryOrganizationCertificates(organizationId), error: null }
  return await fetchOrganizationCertificates(organizationId)
}

const holderAssessments = async (userId: string) =>
  await db
    .select({ courseId: lessons.courseId, reflection: userAssessments.reflection, value: userAssessments.value })
    .from(userAssessments)
    .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
    .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
    .where(eq(userAssessments.userId, userId))
    .orderBy(asc(userAssessments.updatedAt))

export const listSkillReflections = async () => {
  const authUser = await getAuthUser()
  if (!authUser) return {} as Record<number, string>

  const rows = await holderAssessments(authUser.id)
  return Object.fromEntries(rows.flatMap(({ courseId, reflection }) => (reflection ? [[courseId, reflection]] : [])))
}

export interface ReviewHolder {
  birthPlace: string | null
  birthday: string | null
  email: string
  firstName: string
  lastName: string | null
  nationality: string | null
}

export interface HolderCourseResult {
  completedAt: string | null
  rating: number | null
  reflection: string | null
}

export const findReviewContext = async (certificateId: number) => {
  const user = await getCurrentUser()

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
      where: eq(certificates.id, certificateId),
      with: {
        skills: { columns: { courseId: true } },
        user: {
          columns: {
            birthPlace: true,
            birthday: true,
            email: true,
            firstName: true,
            lastName: true,
            nationality: true,
          },
        },
      },
    })
    if (!cert || !canViewCertificate(user, cert)) throw new Error('Certificate not found')

    const courseIds = cert.skills.map(({ courseId }) => courseId)
    const [completions, assessmentRows] = await Promise.all([
      db
        .select({ completedAt: userCourses.completedAt, courseId: userCourses.courseId })
        .from(userCourses)
        .where(and(eq(userCourses.userId, cert.userId), inArray(userCourses.courseId, courseIds))),
      holderAssessments(cert.userId),
    ])

    const results: Record<number, HolderCourseResult> = Object.fromEntries(
      courseIds.map(courseId => {
        const mine = assessmentRows.filter(row => row.courseId === courseId)
        const rated = mine.map(({ value }) => value)
        const result: HolderCourseResult = {
          completedAt: completions.find(row => row.courseId === courseId)?.completedAt ?? null,
          rating: rated.length > 0 ? rated.reduce((sum, value) => sum + value, 0) / rated.length : null,
          reflection: mine.findLast(row => row.reflection)?.reflection ?? null,
        }
        return [courseId, result]
      })
    )
    const holder: ReviewHolder = cert.user
    return { holder, results }
  })
}
