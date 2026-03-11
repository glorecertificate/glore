'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { listCourses } from '@/actions/course'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Certificate, parseCertificate } from '@/db/queries/certificate'
import { certificates } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import appConfig from '~/config/app.json'

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
