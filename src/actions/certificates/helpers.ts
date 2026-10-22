import 'server-only'

import { updateTag } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'

import { and, eq } from 'drizzle-orm'
import { type ZodError } from 'zod'

import { expireAdminOverview } from '@/actions/admin/expire'
import { getAuthUser } from '@/actions/auth'
import { notify } from '@/actions/notifications/notify'
import { type Transaction, db, transaction } from '@/db/client'
import { queryError } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { CertificateError } from '@/db/mutations/certificate'
import { type AppEvent, type EventType } from '@/db/queries/activity-event'
import { certificates, memberships } from '@/db/schema'
import { type EnumType } from '@/db/types'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limit'

const certificateUserColumns = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const

const certificateWith = {
  organization: {
    columns: { id: true, name: true, city: true },
    with: { profile: { columns: { avatarUrl: true } } },
  },
  skills: {
    with: {
      course: { columns: { id: true, slug: true, title: true } },
    },
  },
} as const

export const certificateOwnerWith = {
  ...certificateWith,
  rating: true,
  user: { columns: certificateUserColumns },
} as const

export const certificatePublicWith = {
  ...certificateWith,
  user: { columns: { id: true, firstName: true, lastName: true } },
} as const

export const certificateWithUsers = {
  ...certificateWith,
  user: { columns: certificateUserColumns },
  reviewer: { columns: certificateUserColumns },
} as const

const RATE_LIMIT_WINDOW = 60 * 60 * 1000

type Role = EnumType<'role'>

export const certificateAction = async <T>(work: () => Promise<T>) => {
  try {
    return { data: await work(), error: null }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof CertificateError) return { data: null, error: { code: e.code, message: e.message } }
    return { data: null, error: queryError(e) }
  }
}

export const invalidInput = (error: ZodError) =>
  new CertificateError(
    'INVALID_INPUT',
    `Invalid certificate values: ${[...new Set(error.issues.map(({ path }) => path.join('.')))].join(', ')}`
  )

const requireAuthUser = async () => {
  const authUser = await getAuthUser()
  if (!authUser) throw new CertificateError('UNAUTHORIZED', 'Not authenticated')
  return authUser
}

const limitRate = async (action: string, userId: string, max: number) => {
  const { limited } = await checkRateLimit(`certificate:${action}:${userId}`, max, RATE_LIMIT_WINDOW)
  if (limited) throw new CertificateError('RATE_LIMITED', 'Too many requests. Try again later.')
}

export const requireRateLimitedUser = async (action: string, max: number) => {
  const authUser = await requireAuthUser()
  await limitRate(action, authUser.id, max)
  return authUser
}

export const membershipRole = async (userId: string, organizationId: number): Promise<Role | null> => {
  const membership = await db.query.memberships.findFirst({
    columns: { role: true },
    where: and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)),
  })
  return membership?.role ?? null
}

const isManagerRole = (role: Role | null) => role === 'admin' || role === 'representative'

export const findCertificateRow = async (id: number) => {
  const row = await db.query.certificates.findFirst({ where: eq(certificates.id, id) })
  if (!row?.userId) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  return { ...row, userId: row.userId }
}

export const requireCertificateManager = async (
  authUser: { id: string; role?: string | null },
  organizationId: number
) => {
  if (authUser.role === 'admin') return
  const role = await membershipRole(authUser.id, organizationId)
  if (role === null) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  if (!isManagerRole(role)) throw new CertificateError('FORBIDDEN', 'Only organization managers can do this')
}

export const requireManagedCertificate = async (authUser: { id: string; role?: string | null }, id: number) => {
  const cert = await db.query.certificates.findFirst({ where: eq(certificates.id, id) })
  if (!cert) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  await requireCertificateManager(authUser, cert.organizationId)
  return cert
}

const assertTutorRole = (role: string | null) => {
  if (role === null) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  if (role !== 'tutor') throw new CertificateError('FORBIDDEN', 'Not a tutor in this organization')
}

export const requireTutorRole = async (authUserId: string, organizationId: number) => {
  assertTutorRole(await membershipRole(authUserId, organizationId))
}

export const requireAssignedTutor = async (
  authUserId: string,
  certificate: { organizationId: number; reviewerId: string | null; userId: string }
) => {
  const role = await membershipRole(authUserId, certificate.organizationId)
  assertTutorRole(role)
  if (certificate.userId === authUserId) {
    throw new CertificateError('FORBIDDEN', 'Authors cannot review their own certificate')
  }
  if (certificate.reviewerId !== authUserId) {
    throw new CertificateError('FORBIDDEN', 'Only the assigned tutor can do this')
  }
}

export const buildEvent = <K extends EventType>(
  type: K,
  { actorId, organizationId }: Pick<AppEvent, 'actorId' | 'organizationId'>,
  data: AppEvent<K>['data']
): AppEvent<K> => ({ actorId, data, organizationId, type })

export const commitTransition = async <T>(work: (tx: Transaction) => Promise<T>, toEvent: (result: T) => AppEvent) => {
  const committed = await transaction(async tx => {
    const result = await work(tx)
    const event = toEvent(result)
    await recordEvent(tx, event)
    return { event, result }
  })
  await notify(committed.event)
  return committed.result
}

export const expireCertificateCaches = (
  { organizationId, userId }: { organizationId: number; userId: string | null },
  ...tutorIds: (string | null | undefined)[]
) => {
  if (userId) updateTag(certificatesUserTag(userId))
  updateTag(certificatesOrgTag(organizationId))
  expireAdminOverview()
  for (const tutorId of new Set(tutorIds)) {
    if (tutorId) updateTag(certificatesTutorTag(tutorId))
  }
}

export const findAuthoredCertificate = async (id: number, userId: string) => {
  const row = await db.query.certificates.findFirst({
    where: and(eq(certificates.id, id), eq(certificates.userId, userId)),
    with: { rating: true, skills: true },
  })
  if (!row) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  return { ...row, userId }
}
