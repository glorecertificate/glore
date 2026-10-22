'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { and, eq, isNull, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificatePublicWith, certificateWith, certificateWithUsers } from '@/actions/certificates/helpers'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { certificates, users } from '@/db/schema'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import appConfig from '~/config/app.json'

const fetchUserCertificates = cache(async (userId: string) => {
  'use cache'
  cacheTag(certificatesUserTag(userId))
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: certificateWith,
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
      with: certificateWith,
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

export const findCertificate = async (id: number) => {
  const user = await getCurrentUser()

  return await safeQuery(async () => {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
      with: certificateWithUsers,
    })
    if (!cert) throw new Error('Certificate not found')

    const role = user.organizations.find(({ id: orgId }) => orgId === cert.organizationId)?.role
    const isOwner = cert.userId === user.id
    const isManager = role === 'admin' || role === 'representative'
    const isReviewer = cert.reviewerId === user.id
    const isPoolTutor = role === 'tutor' && cert.reviewerId === null && cert.status === 'submitted'
    const canView =
      cert.status === 'draft' ? isOwner : isOwner || isManager || isReviewer || isPoolTutor || user.isAdmin
    if (!canView) throw new Error('Certificate not found')

    return parseCertificate(cert)
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
