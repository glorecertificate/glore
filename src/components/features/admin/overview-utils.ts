import { type AdminOverviewMonth } from '@/db/queries/admin-overview'

const HOURS_PER_DAY = 24
const DAY_THRESHOLD_HOURS = 48

export const monthStart = (month: string) => {
  const [year = 0, index = 1] = month.split('-').map(Number)
  return new Date(Date.UTC(year, index - 1, 1))
}

export const toDuration = (hours: number) =>
  hours >= DAY_THRESHOLD_HOURS
    ? ({ unit: 'day', value: hours / HOURS_PER_DAY } as const)
    : ({ unit: 'hour', value: hours } as const)

export type OverviewMetric = Exclude<keyof AdminOverviewMonth, 'month'>

export const hasMonthlyActivity = (monthly: AdminOverviewMonth[], keys: OverviewMetric[]) =>
  monthly.some(row => keys.some(key => row[key] > 0))
