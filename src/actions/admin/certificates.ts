'use server'

import 'server-only'

import { type SQL, and, count, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'

import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { normalizeCertificateCode } from '@/components/features/certificates/rules'
import { db } from '@/db/client'
import { adminError } from '@/db/mutations/moderation'
import {
  ADMIN_CERTIFICATES_PAGE_SIZE,
  type AdminCertificateRow,
  type AdminCertificatesQuery,
  adminCertificatesQuerySchema,
} from '@/db/queries/admin-certificate'
import { likePattern, searchTokens, toPage } from '@/db/queries/admin-user'
import { certificates, organizations, users } from '@/db/schema'

type ParsedQuery = ReturnType<typeof adminCertificatesQuerySchema.parse>

const snapshotFirstName = sql<string | null>`${certificates.snapshot}->'holder'->>'firstName'`
const snapshotLastName = sql<string | null>`${certificates.snapshot}->'holder'->>'lastName'`

const buildFilters = (query: ParsedQuery) => {
  const conditions: (SQL | undefined)[] = [ne(certificates.status, 'draft')]
  if (query.status) conditions.push(eq(certificates.status, query.status))

  const code = query.q ? normalizeCertificateCode(query.q) : null
  if (code) {
    conditions.push(eq(certificates.code, code))
    return and(...conditions)
  }

  for (const token of searchTokens(query.q)) {
    const pattern = likePattern(token)
    conditions.push(
      or(
        ilike(certificates.code, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
        ilike(snapshotFirstName, pattern),
        ilike(snapshotLastName, pattern),
        ilike(organizations.name, pattern)
      )
    )
  }
  return and(...conditions)
}

export const searchAdminCertificates = async (input: AdminCertificatesQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    const parsed = adminCertificatesQuerySchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const where = buildFilters(parsed.data)
    const [totals] = await db
      .select({ total: count() })
      .from(certificates)
      .leftJoin(users, eq(users.id, certificates.userId))
      .innerJoin(organizations, eq(organizations.id, certificates.organizationId))
      .where(where)
    const total = totals?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_CERTIFICATES_PAGE_SIZE))
    const page = Math.min(parsed.data.page ?? 1, pageCount)

    const records = await db
      .select({
        code: certificates.code,
        email: users.email,
        firstName: users.firstName,
        formerFirstName: snapshotFirstName,
        formerLastName: snapshotLastName,
        holderId: users.id,
        id: certificates.id,
        issuedAt: certificates.issuedAt,
        lastName: users.lastName,
        organizationId: organizations.id,
        organizationName: organizations.name,
        revokedAt: certificates.revokedAt,
        status: certificates.status,
        submittedAt: certificates.submittedAt,
      })
      .from(certificates)
      .leftJoin(users, eq(users.id, certificates.userId))
      .innerJoin(organizations, eq(organizations.id, certificates.organizationId))
      .where(where)
      .orderBy(desc(sql`coalesce(${certificates.submittedAt}, ${certificates.createdAt})`), desc(certificates.id))
      .limit(ADMIN_CERTIFICATES_PAGE_SIZE)
      .offset((page - 1) * ADMIN_CERTIFICATES_PAGE_SIZE)

    const rows = records.flatMap(
      ({
        email,
        firstName,
        formerFirstName,
        formerLastName,
        holderId,
        lastName,
        organizationId,
        organizationName,
        ...row
      }) =>
        row.status === 'draft'
          ? []
          : [
              {
                ...row,
                holder: {
                  email,
                  firstName: firstName ?? formerFirstName ?? '',
                  id: holderId,
                  lastName: firstName ? lastName : formerLastName,
                },
                organization: { id: organizationId, name: organizationName },
                status: row.status,
              } satisfies AdminCertificateRow,
            ]
    )

    return toPage(rows, { page, pageSize: ADMIN_CERTIFICATES_PAGE_SIZE, total })
  })
