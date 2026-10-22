import { z } from 'zod'

import { type EventType } from '@/db/queries/activity-event'
import { type AdminPage } from '@/db/queries/admin-user'

export const ADMIN_AUDIT_PAGE_SIZE = 25

export const AUDIT_CATEGORIES = ['moderation', 'access', 'impersonation', 'certificates', 'organizations'] as const

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

export const AUDIT_ACTIONS = {
  access: ['team.invited', 'team.role_changed'],
  certificates: ['certificate.revoked'],
  impersonation: ['impersonation.started', 'impersonation.stopped'],
  moderation: ['account.suspended', 'account.reinstated'],
  organizations: ['organization.application_decided'],
} as const satisfies Record<AuditCategory, readonly EventType[]>

export type AuditAction = (typeof AUDIT_ACTIONS)[AuditCategory][number]

export const AUDITED_ACTIONS: AuditAction[] = AUDIT_CATEGORIES.flatMap(category => [...AUDIT_ACTIONS[category]])

export const auditActionsOf = (category: AuditCategory | null | undefined): AuditAction[] =>
  category ? [...AUDIT_ACTIONS[category]] : AUDITED_ACTIONS

export const auditCategoryOf = (action: string) =>
  AUDIT_CATEGORIES.find(category => (AUDIT_ACTIONS[category] as readonly string[]).includes(action)) ?? null

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/u

const dateSchema = z
  .string()
  .regex(DATE_REGEX)
  .refine(value => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)))

export const adminAuditQuerySchema = z.object({
  category: z.enum(AUDIT_CATEGORIES).nullish(),
  from: dateSchema.nullish(),
  page: z.number().int().min(1).max(10_000).nullish(),
  q: z.string().max(200).nullish(),
  to: dateSchema.nullish(),
})

export type AdminAuditQuery = z.input<typeof adminAuditQuerySchema>

export const auditDayStart = (date: string) => `${date}T00:00:00.000Z`

export const auditDayEnd = (date: string) => new Date(Date.parse(auditDayStart(date)) + DAY_MS).toISOString()

interface AuditPerson {
  email: string
  id: string
  name: string
}

interface AuditTarget {
  href: string | null
  kind: 'certificate' | 'organization' | 'user'
  label: string
}

export interface AuditDetail {
  approved: boolean | null
  comment: string | null
  expiresAt: string | null
  reason: string | null
  role: 'admin' | 'editor' | 'user' | null
}

export interface AdminAuditRow {
  action: AuditAction
  actor: AuditPerson | null
  category: AuditCategory
  createdAt: string
  detail: AuditDetail
  id: number
  organization: { id: number; name: string } | null
  target: AuditTarget | null
}

export type AdminAuditPage = AdminPage<AdminAuditRow>

export interface AuditRecord {
  action: string
  actorId: string | null
  createdAt: string
  id: number
  metadata: Record<string, unknown>
  organizationId: number | null
  subjectId: string
}

export interface AuditLookups {
  certificateCodes: Map<number, string | null>
  organizations: Map<number, string>
  people: Map<string, AuditPerson>
}

const stringOf = (value: unknown) => (typeof value === 'string' && value ? value : null)

const numberOf = (value: unknown, fallback?: string) => {
  const parsed = typeof value === 'number' ? value : Number(fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const roleOf = (action: string, value: unknown) => {
  if (action !== 'team.role_changed' && action !== 'team.invited') return null
  return value === 'admin' || value === 'editor' ? value : 'user'
}

export const auditDetail = (record: Pick<AuditRecord, 'action' | 'metadata'>): AuditDetail => {
  const { action, metadata } = record
  return {
    approved: typeof metadata.approved === 'boolean' ? metadata.approved : null,
    comment: stringOf(metadata.comment),
    expiresAt: stringOf(metadata.expiresAt),
    reason: stringOf(metadata.reason),
    role: roleOf(action, metadata.role),
  }
}

export const auditPersonIds = (records: Pick<AuditRecord, 'actorId' | 'metadata'>[]) => {
  const ids = new Set<string>()
  for (const { actorId, metadata } of records) {
    for (const id of [actorId, stringOf(metadata.userId), stringOf(metadata.holderId)]) {
      if (id) ids.add(id)
    }
  }
  return [...ids]
}

export const auditCertificateIds = (records: Pick<AuditRecord, 'action' | 'metadata' | 'subjectId'>[]) => {
  const ids = new Set<number>()
  for (const { action, metadata, subjectId } of records) {
    if (!action.startsWith('certificate.')) continue
    const id = numberOf(metadata.certificateId, subjectId)
    if (id) ids.add(id)
  }
  return [...ids]
}

export const auditOrganizationIds = (records: Pick<AuditRecord, 'organizationId'>[]) => {
  const ids = new Set<number>()
  for (const { organizationId } of records) {
    if (organizationId) ids.add(organizationId)
  }
  return [...ids]
}

const auditTarget = (record: AuditRecord, lookups: AuditLookups): AuditTarget | null => {
  const { action, metadata, organizationId, subjectId } = record

  if (action.startsWith('certificate.')) {
    const id = numberOf(metadata.certificateId, subjectId)
    if (!id) return null
    const code = lookups.certificateCodes.get(id)
    return { href: `/certificates/${id}`, kind: 'certificate', label: code ?? `#${id}` }
  }

  if (action.startsWith('organization.')) {
    const id = organizationId ?? numberOf(undefined, subjectId)
    const name = (id ? lookups.organizations.get(id) : null) ?? stringOf(metadata.organizationName)
    if (!name) return null
    return { href: id ? `/admin/organizations/${id}` : null, kind: 'organization', label: name }
  }

  const userId = stringOf(metadata.userId) ?? stringOf(subjectId)
  const person = userId ? lookups.people.get(userId) : null
  if (!person) return null
  return { href: `/admin/users?q=${encodeURIComponent(person.email)}`, kind: 'user', label: person.name }
}

export const toAuditRows = (records: AuditRecord[], lookups: AuditLookups): AdminAuditRow[] =>
  records.flatMap(record => {
    const action = AUDITED_ACTIONS.find(known => known === record.action)
    const category = auditCategoryOf(record.action)
    if (!(action && category)) return []
    const organization = record.organizationId ? lookups.organizations.get(record.organizationId) : null
    return [
      {
        action,
        actor: (record.actorId && lookups.people.get(record.actorId)) || null,
        category,
        createdAt: record.createdAt,
        detail: auditDetail(record),
        id: record.id,
        organization: record.organizationId && organization ? { id: record.organizationId, name: organization } : null,
        target: auditTarget(record, lookups),
      },
    ]
  })
