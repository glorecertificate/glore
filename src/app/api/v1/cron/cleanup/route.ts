import { timingSafeEqual } from 'node:crypto'

import { type NextRequest, NextResponse } from 'next/server'

import { isNotNull } from 'drizzle-orm'

import { db } from '@/db/client'
import { organizationProfiles, users } from '@/db/schema'
import { pruneRateLimits } from '@/lib/rate-limit'
import { r2Delete, r2List, selectOrphanKeys } from '@/lib/storage'

const DAY = 24 * 60 * 60 * 1000

const AVATAR_PREFIXES = ['avatars/', 'organizations/']

const isAuthorized = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET
  if (!secret || process.env.NODE_ENV !== 'production') return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

const sweepOrphanAvatars = async () => {
  const [userAvatars, organizationAvatars, ...listings] = await Promise.all([
    db.select({ url: users.avatarUrl }).from(users).where(isNotNull(users.avatarUrl)),
    db
      .select({ url: organizationProfiles.avatarUrl })
      .from(organizationProfiles)
      .where(isNotNull(organizationProfiles.avatarUrl)),
    ...AVATAR_PREFIXES.map(r2List),
  ])

  const referenced = [...userAvatars, ...organizationAvatars].flatMap(({ url }) => (url ? [url] : []))
  const orphans = selectOrphanKeys(listings.flat(), referenced, new Date(Date.now() - DAY))

  await Promise.all(orphans.map(r2Delete))

  return orphans.length
}

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [rateLimits, avatars] = await Promise.all([pruneRateLimits(DAY), sweepOrphanAvatars()])

  return NextResponse.json({ deleted: { avatars, rateLimits } })
}
