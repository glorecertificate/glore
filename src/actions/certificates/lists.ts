import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { and, eq, isNull, ne } from 'drizzle-orm'

import { certificateOwnerWith, certificateWithUsers } from '@/actions/certificates/helpers'
import { fetchCourses } from '@/actions/courses/helpers'
import { getViewer, getViewerContext } from '@/actions/viewer'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { certificates } from '@/db/schema'
import { LIVE_LIFE, certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import appConfig from '~/config/app.json'

export const fetchUserCertificates = cache(async (userId: string) => {
  'use cache'
  cacheTag(certificatesUserTag(userId))
  cacheLife(LIVE_LIFE)

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

export const queryTutorCertificates = async (reviewerId: string, organizationId: number) => {
  const result = await db.query.certificates.findMany({
    where: and(
      eq(certificates.reviewerId, reviewerId),
      eq(certificates.organizationId, organizationId),
      ne(certificates.userId, reviewerId),
      isNull(certificates.holderDeletedAt),
      ne(certificates.status, 'draft')
    ),
    with: certificateWithUsers,
    orderBy: (certs, { desc }) => [desc(certs.updatedAt)],
    limit: 500,
  })
  return result.map(parseCertificate)
}

export const fetchTutorCertificates = cache(async (reviewerId: string, organizationId: number) => {
  'use cache'
  cacheTag(certificatesTutorTag(reviewerId))
  cacheLife(LIVE_LIFE)

  return await safeQuery(() => queryTutorCertificates(reviewerId, organizationId))
})

export const queryUnassignedOrgCertificates = async (orgId: number) => {
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

export const fetchUnassignedOrgCertificates = cache(async (orgId: number) => {
  'use cache'
  cacheTag(certificatesOrgTag(orgId))
  cacheLife(LIVE_LIFE)

  return await safeQuery(() => queryUnassignedOrgCertificates(orgId))
})

export const queryOrganizationCertificates = async (organizationId: number) => {
  const result = await db.query.certificates.findMany({
    where: and(eq(certificates.organizationId, organizationId), ne(certificates.status, 'draft')),
    with: certificateWithUsers,
    orderBy: (c, { desc: byDesc }) => [byDesc(c.updatedAt)],
    limit: 500,
  })
  return result.map(parseCertificate)
}

export const fetchOrganizationCertificates = cache(async (organizationId: number) => {
  'use cache'
  cacheTag(certificatesOrgTag(organizationId))
  cacheLife(LIVE_LIFE)

  return await safeQuery(() => queryOrganizationCertificates(organizationId))
})

export const loadUserCertificates = async () => {
  const user = await getViewer()
  return await fetchUserCertificates(user.id)
}

export const loadTutorCertificates = async () => {
  const { orgId, role, user } = await getViewerContext()
  if (!orgId || role !== 'tutor') return { data: [] as Certificate[], error: null }
  return await fetchTutorCertificates(user.id, orgId)
}

export const loadUnassignedCertificates = async () => {
  const { orgId, role, user } = await getViewerContext()
  if (!orgId) return { data: null, error: { code: 'NO_ORG', message: 'No active organization' } }
  if (!(role === 'admin' || role === 'representative' || role === 'tutor')) {
    return { data: [] as Certificate[], error: null }
  }

  const { data, error } = await fetchUnassignedOrgCertificates(orgId)
  return { data: data?.filter(({ userId }) => userId !== user.id) ?? null, error }
}

export const loadOrganizationCertificates = async (organizationId: number) => {
  const { role, user } = await getViewerContext()
  const memberRole = user.organizations.find(({ id }) => id === organizationId)?.role ?? role
  if (!(user.isAdmin || memberRole === 'admin' || memberRole === 'representative')) {
    return { data: [] as Certificate[], error: null }
  }
  return await fetchOrganizationCertificates(organizationId)
}

export const loadCertificateEligibility = async () => {
  const { user } = await getViewerContext()
  const { data: courses, error } = await fetchCourses(user.canEdit ? undefined : user.id)
  const completedSkillCourseIds =
    error || !courses ? [] : courses.flatMap(course => (course.type === 'skill' && course.completed ? [course.id] : []))

  return {
    completedSkillCount: completedSkillCourseIds.length,
    completedSkillCourseIds,
    eligible: completedSkillCourseIds.length >= appConfig.minSkills,
    minSkills: appConfig.minSkills,
  }
}
