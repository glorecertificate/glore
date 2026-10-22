import { type Pipeline, lastMonths } from '@/db/queries/organization-insights'

export const ADMIN_OVERVIEW_MONTHS = 12

interface MonthlyTotal {
  month: string
  total: number
}

export interface MonthlyReviewRow {
  averageHours: number | null
  medianHours: number | null
  month: string
  sample: number
}

export interface AdminOverviewMonth {
  certificatesApproved: number
  certificatesSubmitted: number
  month: string
  organizationsApproved: number
  organizationsRegistered: number
  usersJoined: number
}

export interface AdminOverviewMonthlyInput {
  certificatesApproved: MonthlyTotal[]
  certificatesSubmitted: MonthlyTotal[]
  organizationsApproved: MonthlyTotal[]
  organizationsRegistered: MonthlyTotal[]
  usersJoined: MonthlyTotal[]
}

interface AdminOverviewReview {
  averageHours: number | null
  medianHours: number | null
  monthly: MonthlyReviewRow[]
  overdue: number
  sample: number
  waiting: number
}

export interface AdminOverview {
  certificates: { drafts: number; pipeline: Pipeline; total: number }
  generatedAt: string
  monthly: AdminOverviewMonth[]
  organizations: { active: number; pending: number; rejected: number; total: number }
  review: AdminOverviewReview
  users: { admins: number; banned: number; editors: number; pending: number; total: number }
}

const totalsBy = (rows: MonthlyTotal[]) => new Map(rows.map(({ month, total }) => [month, total]))

export const overviewMonths = (now: Date) => lastMonths(now, ADMIN_OVERVIEW_MONTHS)

export const toOverviewMonthly = (months: string[], input: AdminOverviewMonthlyInput): AdminOverviewMonth[] => {
  const approved = totalsBy(input.certificatesApproved)
  const submitted = totalsBy(input.certificatesSubmitted)
  const organizationsApproved = totalsBy(input.organizationsApproved)
  const registered = totalsBy(input.organizationsRegistered)
  const joined = totalsBy(input.usersJoined)
  return months.map(month => ({
    certificatesApproved: approved.get(month) ?? 0,
    certificatesSubmitted: submitted.get(month) ?? 0,
    month,
    organizationsApproved: organizationsApproved.get(month) ?? 0,
    organizationsRegistered: registered.get(month) ?? 0,
    usersJoined: joined.get(month) ?? 0,
  }))
}

export const toReviewMonthly = (months: string[], rows: MonthlyReviewRow[]): MonthlyReviewRow[] => {
  const byMonth = new Map(rows.map(row => [row.month, row]))
  return months.map(month => byMonth.get(month) ?? { averageHours: null, medianHours: null, month, sample: 0 })
}

export const roundHours = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const hours = Number(value)
  return Number.isFinite(hours) ? Math.round(hours * 10) / 10 : null
}

export const sumPipeline = (pipeline: Pipeline) => Object.values(pipeline).reduce((total, value) => total + value, 0)
