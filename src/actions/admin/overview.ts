'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { type SQL, and, count, gte, isNotNull, sql } from 'drizzle-orm'
import { type PgColumn, type PgTable } from 'drizzle-orm/pg-core'

import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { db } from '@/db/client'
import {
  type AdminOverview,
  overviewMonths,
  roundHours,
  sumPipeline,
  toOverviewMonthly,
  toReviewMonthly,
} from '@/db/queries/admin-overview'
import { toPipeline } from '@/db/queries/organization-insights'
import { certificates, organizationJoinRequests, organizations, users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import config from '~/config/app.json'

const OVERDUE_DAYS = Math.max(...config.reviewReminderDays)

const UTC_NOW = sql`(now() at time zone 'utc')`

const monthOf = (column: PgColumn) => sql<string>`to_char(date_trunc('month', ${column}), 'YYYY-MM')`

const countFilter = (condition: SQL) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number)

const countByMonth = async (table: PgTable, column: PgColumn, since: string) =>
  await db
    .select({ month: monthOf(column), total: count() })
    .from(table)
    .where(gte(column, since))
    .groupBy(monthOf(column))

const REVIEW_SECONDS = sql`extract(epoch from (${certificates.reviewedAt} - ${certificates.submittedAt}))`

const reviewColumns = () => ({
  averageHours: sql<string | null>`avg(${REVIEW_SECONDS}) / 3600`,
  medianHours: sql<string | null>`percentile_cont(0.5) within group (order by ${REVIEW_SECONDS}) / 3600`,
  sample: count(),
})

const reviewed = and(isNotNull(certificates.reviewedAt), isNotNull(certificates.submittedAt))

const hasRejectedApplication = sql`exists (
  select 1 from ${organizationJoinRequests}
  where ${organizationJoinRequests.organizationId} = ${organizations.id}
    and ${organizationJoinRequests.role} = 'admin'
    and ${organizationJoinRequests.status} = 'rejected'
)`

const fetchOverview = async (): Promise<AdminOverview> => {
  'use cache'
  cacheTag(CacheTag.AdminOverview)
  cacheLife('minutes')

  const now = new Date()
  const months = overviewMonths(now)
  const since = `${months[0]}-01`

  const [
    userTotals,
    organizationTotals,
    statuses,
    usersJoined,
    organizationsRegistered,
    organizationsApproved,
    certificatesSubmitted,
    certificatesApproved,
    reviewTotals,
    reviewMonths,
    backlog,
  ] = await Promise.all([
    db
      .select({
        admins: countFilter(sql`${users.role} = 'admin'`),
        banned: countFilter(
          sql`${users.banned} is true and (${users.banExpires} is null or ${users.banExpires} > ${UTC_NOW})`
        ),
        editors: countFilter(sql`${users.isEditor} is true and ${users.role} is distinct from 'admin'`),
        pending: countFilter(sql`${users.onboardedAt} is null`),
        total: count(),
      })
      .from(users),
    db
      .select({
        active: countFilter(sql`${organizations.approvedAt} is not null`),
        pending: countFilter(sql`${organizations.approvedAt} is null and not ${hasRejectedApplication}`),
        rejected: countFilter(sql`${organizations.approvedAt} is null and ${hasRejectedApplication}`),
        total: count(),
      })
      .from(organizations),
    db.select({ status: certificates.status, total: count() }).from(certificates).groupBy(certificates.status),
    countByMonth(users, users.createdAt, since),
    countByMonth(organizations, organizations.createdAt, since),
    countByMonth(organizations, organizations.approvedAt, since),
    countByMonth(certificates, certificates.submittedAt, since),
    countByMonth(certificates, certificates.issuedAt, since),
    db.select(reviewColumns()).from(certificates).where(reviewed),
    db
      .select({ ...reviewColumns(), month: monthOf(certificates.reviewedAt) })
      .from(certificates)
      .where(and(reviewed, gte(certificates.reviewedAt, since)))
      .groupBy(monthOf(certificates.reviewedAt)),
    db
      .select({
        overdue: countFilter(
          sql`${certificates.status} in ('submitted', 'in_review') and ${certificates.submittedAt} < ${UTC_NOW} - make_interval(days => ${OVERDUE_DAYS})`
        ),
        waiting: countFilter(sql`${certificates.status} in ('submitted', 'in_review')`),
      })
      .from(certificates),
  ])

  const pipeline = toPipeline(statuses.map(({ status, total }) => ({ status, total })))
  const drafts = statuses.find(({ status }) => status === 'draft')?.total ?? 0

  return {
    certificates: { drafts, pipeline, total: sumPipeline(pipeline) },
    generatedAt: now.toISOString(),
    monthly: toOverviewMonthly(months, {
      certificatesApproved,
      certificatesSubmitted,
      organizationsApproved,
      organizationsRegistered,
      usersJoined,
    }),
    organizations: {
      active: organizationTotals[0]?.active ?? 0,
      pending: organizationTotals[0]?.pending ?? 0,
      rejected: organizationTotals[0]?.rejected ?? 0,
      total: organizationTotals[0]?.total ?? 0,
    },
    review: {
      averageHours: roundHours(reviewTotals[0]?.averageHours),
      medianHours: roundHours(reviewTotals[0]?.medianHours),
      monthly: toReviewMonthly(
        months,
        reviewMonths.map(({ averageHours, medianHours, month, sample }) => ({
          averageHours: roundHours(averageHours),
          medianHours: roundHours(medianHours),
          month,
          sample,
        }))
      ),
      overdue: backlog[0]?.overdue ?? 0,
      sample: reviewTotals[0]?.sample ?? 0,
      waiting: backlog[0]?.waiting ?? 0,
    },
    users: {
      admins: userTotals[0]?.admins ?? 0,
      banned: userTotals[0]?.banned ?? 0,
      editors: userTotals[0]?.editors ?? 0,
      pending: userTotals[0]?.pending ?? 0,
      total: userTotals[0]?.total ?? 0,
    },
  }
}

export const getAdminOverview = async () =>
  await adminAction(async () => {
    await requireAdmin()
    return await fetchOverview()
  })
