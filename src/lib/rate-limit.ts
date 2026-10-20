import 'server-only'

import { headers } from 'next/headers'

import { lt, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { rateLimits } from '@/db/schema/rate-limits'

export const checkRateLimit = async (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const expired = sql`${rateLimits.lastRequest} <= ${now - windowMs}`

  const [entry] = await db
    .insert(rateLimits)
    .values({ id: crypto.randomUUID(), key: `app:${key}`, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimits.lastRequest} end`,
      },
    })
    .returning({ count: rateLimits.count })

  const count = entry?.count ?? 1
  return { limited: count > max, remaining: Math.max(max - count, 0) }
}

export const clientAddress = async () => {
  const list = await headers()
  return list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'unknown'
}

export const isRateLimited = async (key: string, max: number, windowMs: number) =>
  (await checkRateLimit(key, max, windowMs)).limited

export const pruneRateLimits = async (maxAgeMs: number) => {
  const deleted = await db
    .delete(rateLimits)
    .where(lt(rateLimits.lastRequest, Date.now() - maxAgeMs))
    .returning({ id: rateLimits.id })
  return deleted.length
}
