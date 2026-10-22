'use server'

import 'server-only'

import { headers } from 'next/headers'

import { and, desc, eq, gt, ne, sql } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { queryError } from '@/db/helpers'
import { sessions } from '@/db/schema'
import { auth } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000
const SESSION_LIMIT = 20

const storedAt = (value: string) => new Date(value.replace(' ', 'T')).toISOString()

export interface SessionSummary {
  createdAt: string
  current: boolean
  id: string
  ipAddress: string | null
  updatedAt: string
  userAgent: string | null
}

const unauthenticated = () => ({ code: 'UNAUTHORIZED', message: 'Not authenticated' })

const currentSessionId = async () => {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  return session?.session.id ?? null
}

export const listSessions = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  try {
    const columns = {
      createdAt: sessions.createdAt,
      id: sessions.id,
      ipAddress: sessions.ipAddress,
      updatedAt: sessions.updatedAt,
      userAgent: sessions.userAgent,
    }
    const active = and(eq(sessions.userId, user.id), gt(sessions.expiresAt, sql<string>`${new Date()}`))
    const [recent, current] = await Promise.all([
      db.select(columns).from(sessions).where(active).orderBy(desc(sessions.updatedAt)).limit(SESSION_LIMIT),
      currentSessionId(),
    ])
    const pinned =
      current && !recent.some(row => row.id === current)
        ? await db
            .select(columns)
            .from(sessions)
            .where(and(active, eq(sessions.id, current)))
        : []
    const data: SessionSummary[] = [...pinned, ...recent].map(row => ({
      ...row,
      createdAt: storedAt(row.createdAt),
      current: row.id === current,
      updatedAt: storedAt(row.updatedAt),
    }))
    return { data, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const revokeSession = async (id: string) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }
  if (await isRateLimited(`sessions:${user.id}`, 30, HOUR)) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
  }

  try {
    if (id === (await currentSessionId())) {
      return { data: null, error: { code: 'CURRENT_SESSION', message: 'Sign out to end this session' } }
    }
    const [revoked] = await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))
      .returning({ id: sessions.id })
    if (!revoked) return { data: null, error: { code: 'NOT_FOUND', message: 'Session not found' } }

    return { data: { id }, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const revokeOtherSessions = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }
  if (await isRateLimited(`sessions:${user.id}`, 30, HOUR)) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
  }

  try {
    const current = await currentSessionId()
    if (!current) return { data: null, error: unauthenticated() }
    const revoked = await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.id, current)))
      .returning({ id: sessions.id })
    return { data: { count: revoked.length }, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
