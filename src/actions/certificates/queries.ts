'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { and, eq, isNull } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { certificateWith, certificateWithUsers } from '@/actions/certificates/helpers'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId } from '@/actions/user'
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

const fetchTutorCertificates = cache(async (reviewerId: string) => {
  'use cache'
  cacheTag(certificatesTutorTag(reviewerId))
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.reviewerId, reviewerId),
      with: certificateWithUsers,
      orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
      limit: 500,
    })
    return result.map(parseCertificate)
  })
})

export const listTutorCertificates = async ({ cache: useCache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  if (!useCache) {
    const result = await db.query.certificates.findMany({
      where: eq(certificates.reviewerId, authUser.id),
      with: certificateWithUsers,
      orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
      limit: 500,
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

export interface CertificateEligibility {
  eligible: boolean
  completedSkillCount: number
  minSkills: number
  minRating: number
  hasLowRatings: boolean
  avgRating: number | null
}

export const getCertificateEligibility = cache(async (): Promise<CertificateEligibility> => {
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
})

const fetchUnassignedOrgCertificates = cache(async (orgId: number) => {
  'use cache'
  cacheTag(certificatesOrgTag(orgId))
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
      limit: 500,
    })
    return result.map(parseCertificate)
  })
})

export const listUnassignedOrgCertificates = async ({ cache: useCache = true }: { cache?: boolean } = {}): Promise<{
  data: Certificate[] | null
  error: unknown
}> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const orgId = await getActiveOrgId()
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }

  if (!useCache) {
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
    return { data: result.map(parseCertificate), error: null }
  }
  return await fetchUnassignedOrgCertificates(orgId)
}
