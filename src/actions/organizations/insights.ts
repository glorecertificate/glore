'use server'

import 'server-only'

import { and, avg, count, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm'

import { getOrganizationAccess, reviewerColumns } from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { db } from '@/db/client'
import { memberError } from '@/db/mutations/organization'
import { lastMonths, summarizeRatings, toMonthlySeries, toTutorWorkload } from '@/db/queries/organization-insights'
import { certificates, memberships, organizationRatings, userCourses } from '@/db/schema'
import { fullName } from '@/lib/utils'

const monthOf = (column: typeof certificates.submittedAt | typeof certificates.issuedAt) =>
  sql<string>`to_char(date_trunc('month', ${column}), 'YYYY-MM')`

const toNumber = (value: string | number | null | undefined) =>
  value === null || value === undefined ? null : Number(value)

export const getOrganizationInsights = async (organizationId?: number) =>
  await guarded(async () => {
    const access = await getOrganizationAccess(organizationId)
    if (access.role !== 'admin' && access.role !== 'representative') throw memberError('FORBIDDEN')
    const id = access.organizationId
    const months = lastMonths(new Date())
    const since = `${months[0]}-01`
    const learnerRoles = ['learner', 'volunteer'] as const

    const [submitted, approved, review, tutors, workload, learners, learning, ratings] = await Promise.all([
      db
        .select({ month: monthOf(certificates.submittedAt), total: count() })
        .from(certificates)
        .where(and(eq(certificates.organizationId, id), gte(certificates.submittedAt, since)))
        .groupBy(monthOf(certificates.submittedAt)),
      db
        .select({ month: monthOf(certificates.issuedAt), total: count() })
        .from(certificates)
        .where(and(eq(certificates.organizationId, id), gte(certificates.issuedAt, since)))
        .groupBy(monthOf(certificates.issuedAt)),
      db
        .select({
          hours: sql<
            string | null
          >`avg(extract(epoch from (${certificates.reviewedAt} - ${certificates.submittedAt}))) / 3600`,
          sample: count(),
        })
        .from(certificates)
        .where(
          and(
            eq(certificates.organizationId, id),
            isNotNull(certificates.reviewedAt),
            isNotNull(certificates.submittedAt)
          )
        ),
      db.query.memberships.findMany({
        columns: { userId: true },
        where: and(eq(memberships.organizationId, id), eq(memberships.role, 'tutor')),
        with: { user: { columns: { ...reviewerColumns, avatarUrl: true } } },
      }),
      db
        .select({ reviewerId: certificates.reviewerId, status: certificates.status, total: count() })
        .from(certificates)
        .where(and(eq(certificates.organizationId, id), isNotNull(certificates.reviewerId)))
        .groupBy(certificates.reviewerId, certificates.status),
      db
        .select({ total: count() })
        .from(memberships)
        .where(and(eq(memberships.organizationId, id), inArray(memberships.role, [...learnerRoles]))),
      db
        .select({
          completedCourses:
            sql<number>`count(${userCourses.id}) filter (where ${userCourses.completedAt} is not null)`.mapWith(Number),
          completedPeople:
            sql<number>`count(distinct ${userCourses.userId}) filter (where ${userCourses.completedAt} is not null)`.mapWith(
              Number
            ),
          startedPeople: sql<number>`count(distinct ${userCourses.userId})`.mapWith(Number),
        })
        .from(userCourses)
        .innerJoin(
          memberships,
          and(
            eq(memberships.userId, userCourses.userId),
            eq(memberships.organizationId, id),
            inArray(memberships.role, [...learnerRoles])
          )
        ),
      db
        .select({
          certificationSupport: avg(organizationRatings.certificationSupport),
          count: count(),
          experience: avg(organizationRatings.experience),
          recommendTotal: count(organizationRatings.wouldRecommend),
          recommended: sql<number>`count(*) filter (where ${organizationRatings.wouldRecommend} is true)`.mapWith(
            Number
          ),
          support: avg(organizationRatings.support),
        })
        .from(organizationRatings)
        .where(eq(organizationRatings.organizationId, id)),
    ])

    const tutorIds = tutors.map(({ userId }) => userId)
    const tutorPeople = new Map(tutors.map(({ user, userId }) => [userId, user]))
    const ratingRow = ratings[0]
    const learningRow = learning[0]

    return {
      learning: {
        completedCourses: learningRow?.completedCourses ?? 0,
        completedPeople: learningRow?.completedPeople ?? 0,
        people: learners[0]?.total ?? 0,
        startedPeople: learningRow?.startedPeople ?? 0,
      },
      monthly: toMonthlySeries(months, submitted, approved),
      rating: summarizeRatings({
        certificationSupport: toNumber(ratingRow?.certificationSupport),
        count: ratingRow?.count ?? 0,
        experience: toNumber(ratingRow?.experience),
        recommendTotal: ratingRow?.recommendTotal ?? 0,
        recommended: ratingRow?.recommended ?? 0,
        support: toNumber(ratingRow?.support),
      }),
      review: { averageHours: toNumber(review[0]?.hours), sample: review[0]?.sample ?? 0 },
      tutors: toTutorWorkload(
        tutorIds,
        workload.flatMap(({ reviewerId, status, total }) => (reviewerId ? [{ reviewerId, status, total }] : []))
      ).map(entry => {
        const person = tutorPeople.get(entry.tutorId)
        return {
          ...entry,
          avatarUrl: person?.avatarUrl ?? null,
          name: person ? fullName(person) || person.email : entry.tutorId,
        }
      }),
    }
  })

export type OrganizationInsights = NonNullable<Awaited<ReturnType<typeof getOrganizationInsights>>['data']>
