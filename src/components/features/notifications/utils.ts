import { type NotificationCategory } from '@/db/queries/notification'
import { type IconName } from '@/lib/types'

interface Dated {
  createdAt: string
}

export interface DayGroup<T extends Dated> {
  date: Date
  items: T[]
  key: string
  kind: 'earlier' | 'today' | 'yesterday'
}

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

export const groupByDay = <T extends Dated>(items: T[], now = new Date()): DayGroup<T>[] => {
  const today = dayStart(now)
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const groups = new Map<string, DayGroup<T>>()

  for (const item of items) {
    const date = new Date(item.createdAt)
    const key = dayKey(date)
    const group = groups.get(key)
    if (group) {
      group.items.push(item)
      continue
    }
    const start = dayStart(date)
    const kind =
      start.getTime() === today.getTime() ? 'today' : start.getTime() === yesterday.getTime() ? 'yesterday' : 'earlier'
    groups.set(key, { date: start, items: [item], key, kind })
  }

  return [...groups.values()]
}

const CATEGORY_ICONS = {
  account: 'user-round',
  certificates: 'award',
  learning: 'book-open',
  organization: 'building-2',
} as const satisfies Record<NotificationCategory, IconName>

export const notificationIcon = (category: NotificationCategory | null): IconName =>
  category ? CATEGORY_ICONS[category] : 'bell'

export const messageKey = (type: string) => type.replaceAll('.', '_')

export const roleGroup = (type: string) => (type.startsWith('team.') ? 'teamRoles' : 'roles')

const text = (value: unknown) => (typeof value === 'string' ? value : '')

export const messageVariant = (type: string, data: Record<string, unknown>) => {
  if (type === 'join_request.decided') return data.accepted === true ? 'accepted' : 'rejected'
  if (type === 'team.role_changed') return data.role ? 'set' : 'removed'
  if (type === 'organization.ownership_transferred' && (data.variant === 'gained' || data.variant === 'left')) {
    return data.variant
  }
  if (type === 'invitation.accepted' && data.variant === 'platform') return 'platform'
  return null
}

export const messageValues = (data: Record<string, unknown>) => ({
  days: typeof data.days === 'number' ? data.days : 0,
  name: text(data.name) || text(data.applicantName),
  organizationName: text(data.organizationName),
  role: text(data.role),
})
