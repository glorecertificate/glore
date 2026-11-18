'use server'

import 'server-only'

import { cache } from 'react'

import { and, asc, eq, inArray, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificateOwnerWith, certificatePublicWith, certificateWithUsers } from '@/actions/certificates/helpers'
import { holderAssessments } from '@/actions/certificates/holder-levels'
import {
  fetchOrganizationCertificates,
  fetchTutorCertificates,
  fetchUnassignedOrgCertificates,
  fetchUserCertificates,
  queryOrganizationCertificates,
  queryTutorCertificates,
  queryUnassignedOrgCertificates,
} from '@/actions/certificates/lists'
import { findLegacyCertificateCode, isLookupLimited } from '@/actions/certificates/public'
import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { type SkillLevel, plainDescription, plainDescriptions } from '@/db/queries/skill-level-description'
import { activityEvents, certificateReviews, certificates, userCourses, users } from '@/db/schema'
import { type IntlRecord } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
import appConfig from '~/config/app.json'

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
  cert: {
    organizationId: number
    reviewerId: string | null
    status: string
    userId: string | null
  }
) => {
  const role = user.organizations.find(({ id: orgId }) => orgId === cert.organizationId)?.role
  const isOwner = cert.userId === user.id
  if (cert.status === 'draft') return isOwner
  const isManager = role === 'admin' || role === 'representative'
  const isReviewer = role === 'tutor' && cert.reviewerId === user.id
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

const isProfileLimited = cache(async () => await isRateLimited(`profile:${await clientAddress()}`, 60, 60_000))

export const lookupLegacyCertificateCode = async (username: string, handle: string) => {
  if (await isLookupLimited()) return null
  return await findLegacyCertificateCode(username, handle)
}

export const findPublicCertificate = async (username: string) => {
  if (await isProfileLimited()) return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
  return await safeQuery(async () => {
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
}

export interface CertificateEligibility {
  eligible: boolean
  completedSkillCount: number
  minSkills: number
  completedSkillCourseIds: number[]
}

export const getCertificateEligibility = cache(
  async ({ cache: useCache = true } = {}): Promise<CertificateEligibility> => {
    const { minSkills } = appConfig
    const { data: courses, error } = await listCourses({ cache: useCache })
    const completedSkillCourseIds =
      error || !courses ? [] : courses.flatMap(c => (c.type === 'skill' && c.completed ? [c.id] : []))
    const completedSkillCount = completedSkillCourseIds.length

    return {
      eligible: completedSkillCount >= minSkills,
      completedSkillCount,
      minSkills,
      completedSkillCourseIds,
    }
  }
)

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

export interface SkillSelection {
  description: IntlRecord | null
  reflection: string | null
}

export const listSkillSelections = async () => {
  const authUser = await getAuthUser()
  if (!authUser) return {} as Record<number, SkillSelection>

  const rows = await holderAssessments(authUser.id)
  const { data: descriptions } = await fetchLevelDescriptions([...new Set(rows.map(({ courseId }) => courseId))])
  return Object.fromEntries(
    rows.map(({ courseId, reflection, value }) => [
      courseId,
      { description: plainDescription(descriptions?.[courseId]?.[value]), reflection: reflection || null },
    ])
  ) as Record<number, SkillSelection>
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
  descriptions: ReturnType<typeof plainDescriptions>
  level: SkillLevel | null
  pick: SkillLevel | null
  reflection: string | null
}

export const findReviewContext = async (certificateId: number) => {
  const user = await getCurrentUser()

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
      where: eq(certificates.id, certificateId),
      with: {
        skills: { columns: { courseId: true, level: true } },
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
    if (!cert?.userId || !cert.user || cert.reviewerId !== user.id) throw new Error('Certificate not found')
    const { user: holder, userId } = cert

    const courseIds = cert.skills.map(({ courseId }) => courseId)
    const [completions, assessmentRows, descriptions] = await Promise.all([
      db
        .select({ completedAt: userCourses.completedAt, courseId: userCourses.courseId })
        .from(userCourses)
        .where(and(eq(userCourses.userId, userId), inArray(userCourses.courseId, courseIds))),
      holderAssessments(userId),
      fetchLevelDescriptions(courseIds),
    ])

    const results: Record<number, HolderCourseResult> = Object.fromEntries(
      courseIds.map(courseId => {
        const mine = assessmentRows.filter(row => row.courseId === courseId)
        const result: HolderCourseResult = {
          completedAt: completions.find(row => row.courseId === courseId)?.completedAt ?? null,
          descriptions: plainDescriptions(descriptions.data?.[courseId]),
          level: mine.findLast(row => row.value)?.value ?? null,
          pick: cert.skills.find(skill => skill.courseId === courseId)?.level ?? null,
          reflection: mine.findLast(row => row.reflection)?.reflection ?? null,
        }
        return [courseId, result]
      })
    )
    const reviewHolder: ReviewHolder = holder
    return { holder: reviewHolder, results }
  })
}
