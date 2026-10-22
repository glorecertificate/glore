'use server'

import 'server-only'

import { type SQL, and, count, desc, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { db } from '@/db/client'
import { adminError } from '@/db/mutations/moderation'
import {
  ADMIN_AUDIT_PAGE_SIZE,
  type AdminAuditQuery,
  type AuditRecord,
  adminAuditQuerySchema,
  auditActionsOf,
  auditCertificateIds,
  auditDayEnd,
  auditDayStart,
  auditOrganizationIds,
  auditPersonIds,
  toAuditRows,
} from '@/db/queries/admin-audit'
import { likePattern, searchTokens, toPage } from '@/db/queries/admin-user'
import { activityEvents, certificates, organizations, users } from '@/db/schema'
import { fullName } from '@/lib/utils'

type ParsedQuery = ReturnType<typeof adminAuditQuerySchema.parse>

const actor = alias(users, 'audit_actor')
const target = alias(users, 'audit_target')

const targetUserId = sql<
  string | null
>`coalesce(${activityEvents.metadata}->>'userId', ${activityEvents.metadata}->>'holderId')`
const metadataText = (key: string) => sql`${activityEvents.metadata}->>${key}`

const buildFilters = (query: ParsedQuery) => {
  const conditions: (SQL | undefined)[] = [inArray(activityEvents.action, auditActionsOf(query.category))]
  if (query.from) conditions.push(gte(activityEvents.createdAt, auditDayStart(query.from)))
  if (query.to) conditions.push(lt(activityEvents.createdAt, auditDayEnd(query.to)))

  for (const token of searchTokens(query.q)) {
    const pattern = likePattern(token)
    conditions.push(
      or(
        ilike(actor.firstName, pattern),
        ilike(actor.lastName, pattern),
        ilike(actor.email, pattern),
        ilike(target.firstName, pattern),
        ilike(target.lastName, pattern),
        ilike(target.email, pattern),
        ilike(metadataText('organizationName'), pattern),
        ilike(metadataText('applicantName'), pattern)
      )
    )
  }
  return and(...conditions)
}

const resolveRows = async (records: AuditRecord[]) => {
  const personIds = auditPersonIds(records)
  const certificateIds = auditCertificateIds(records)
  const organizationIds = auditOrganizationIds(records)

  const [people, certificateRows, organizationRows] = await Promise.all([
    personIds.length > 0
      ? db
          .select({ email: users.email, firstName: users.firstName, id: users.id, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, personIds))
      : [],
    certificateIds.length > 0
      ? db
          .select({ code: certificates.code, id: certificates.id })
          .from(certificates)
          .where(inArray(certificates.id, certificateIds))
      : [],
    organizationIds.length > 0
      ? db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(inArray(organizations.id, organizationIds))
      : [],
  ])

  return toAuditRows(records, {
    certificateCodes: new Map(certificateRows.map(({ code, id }) => [id, code])),
    organizations: new Map(organizationRows.map(({ id, name }) => [id, name])),
    people: new Map(
      people.map(({ email, firstName, id, lastName }) => [
        id,
        { email, id, name: fullName({ firstName, lastName }) || email },
      ])
    ),
  })
}

export const listAdminAudit = async (input: AdminAuditQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    const parsed = adminAuditQuerySchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const where = buildFilters(parsed.data)
    const [totals] = await db
      .select({ total: count() })
      .from(activityEvents)
      .leftJoin(actor, eq(actor.id, activityEvents.actorId))
      .leftJoin(target, eq(target.id, targetUserId))
      .where(where)
    const total = totals?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_AUDIT_PAGE_SIZE))
    const page = Math.min(parsed.data.page ?? 1, pageCount)

    const records = await db
      .select({
        action: activityEvents.action,
        actorId: activityEvents.actorId,
        createdAt: activityEvents.createdAt,
        id: activityEvents.id,
        metadata: activityEvents.metadata,
        organizationId: activityEvents.organizationId,
        subjectId: activityEvents.subjectId,
      })
      .from(activityEvents)
      .leftJoin(actor, eq(actor.id, activityEvents.actorId))
      .leftJoin(target, eq(target.id, targetUserId))
      .where(where)
      .orderBy(desc(activityEvents.id))
      .limit(ADMIN_AUDIT_PAGE_SIZE)
      .offset((page - 1) * ADMIN_AUDIT_PAGE_SIZE)

    const rows = await resolveRows(
      records.map(record => ({ ...record, metadata: record.metadata as Record<string, unknown> }))
    )
    return toPage(rows, { page, pageSize: ADMIN_AUDIT_PAGE_SIZE, total })
  })
