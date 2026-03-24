import { type NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { pushSubscriptions } from '@/db/schema'
import { auth } from '@/lib/auth'

export const GET = () => NextResponse.json({ vapidKey: process.env.VAPID_PUBLIC_KEY ?? null })

export const POST = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { endpoint?: string; keys?: { auth: string; p256dh: string } }
  if (!body.endpoint || !body.keys) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })

  await db
    .insert(pushSubscriptions)
    .values({ endpoint: body.endpoint, keys: body.keys, userId: session.user.id })
    .onConflictDoNothing()

  return NextResponse.json({ ok: true })
}

export const DELETE = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { endpoint?: string }
  if (!body.endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, session.user.id)))

  return NextResponse.json({ ok: true })
}
