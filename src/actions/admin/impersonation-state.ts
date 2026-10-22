import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { activityEvents } from '@/db/schema/activity-events'
import { auth } from '@/lib/auth'

const findReason = async (adminId: string, sessionId: string) => {
  const [started] = await db
    .select({ metadata: activityEvents.metadata })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.actorId, adminId),
        eq(activityEvents.action, 'impersonation.started'),
        sql`${activityEvents.metadata}->>'sessionId' = ${sessionId}`
      )
    )
    .limit(1)
  const reason = started?.metadata.reason
  return typeof reason === 'string' ? reason : ''
}

const currentSession = async (fresh: boolean) => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: fresh ? { disableCookieCache: true } : undefined,
  })
  const adminId = session?.session.impersonatedBy
  if (!(session && adminId)) return null
  return { adminId, session: session.session, user: session.user }
}

const read = async (fresh: boolean) => {
  const current = await currentSession(fresh)
  if (!current) return null

  return {
    adminId: current.adminId,
    expiresAt: new Date(current.session.expiresAt).toISOString(),
    reason: await findReason(current.adminId, current.session.id),
    sessionId: current.session.id,
    userId: current.user.id,
  }
}

export const getImpersonation = cache(async () => await read(false))

export const readImpersonation = async () => await read(true)

export const isImpersonating = async () => (await currentSession(true)) !== null
