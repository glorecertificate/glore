import { type NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { teamInvitations, users } from '@/db/schema'
import { APP_ROOT, ONBOARDING_ROOT } from '@/lib/constants'

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/onboarding/error', request.url))

  const invitation = await db.query.teamInvitations.findFirst({
    columns: { id: true, userId: true, email: true, expiresAt: true, acceptedAt: true },
    where: eq(teamInvitations.token, token),
  })

  if (!invitation) {
    return NextResponse.redirect(new URL('/onboarding/error', request.url))
  }

  if (invitation.acceptedAt || new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.redirect(new URL('/onboarding/error', request.url))
  }

  // Verify the invited user exists in the database
  const user = await db.query.users.findFirst({
    columns: { id: true, onboardedAt: true },
    where: eq(users.id, invitation.userId),
  })

  if (!user) {
    return NextResponse.redirect(new URL('/onboarding/error', request.url))
  }

  await db
    .update(teamInvitations)
    .set({ acceptedAt: new Date().toISOString() })
    .where(eq(teamInvitations.id, invitation.id))

  if (user.onboardedAt) {
    return NextResponse.redirect(new URL(APP_ROOT, request.url))
  }

  return NextResponse.redirect(new URL(ONBOARDING_ROOT, request.url))
}
