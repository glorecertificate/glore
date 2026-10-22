import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

import { mergeNotificationPreferences } from '@/db/mutations/user'
import { userTag } from '@/lib/cache'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
import { parseUnsubscribeToken } from '@/lib/unsubscribe'

const HOUR = 60 * 60 * 1000

export const GET = (request: NextRequest) => NextResponse.redirect(new URL('/settings?tab=notifications', request.url))

export const POST = async (request: NextRequest) => {
  if (await isRateLimited(`unsubscribe:${await clientAddress()}`, 30, HOUR)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const parsed = parseUnsubscribeToken(request.nextUrl.searchParams.get('token'))
  if (!parsed) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  await mergeNotificationPreferences(parsed.userId, { [parsed.category]: false })
  revalidateTag(userTag(parsed.userId), 'max')

  return NextResponse.json({ unsubscribed: parsed.category })
}
