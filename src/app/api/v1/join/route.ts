import { type NextRequest, NextResponse } from 'next/server'

import { getDatabase, getServiceDatabase } from '@/db/client'
import { APP_ROOT, AUTH_ROOT, ONBOARDING_ROOT } from '@/lib/constants'

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL(AUTH_ROOT, request.url))

  const serviceDb = await getServiceDatabase()

  const { data: invitation, error } = await serviceDb
    .from('team_invitations')
    .select('id, user_id, email, expires_at, accepted_at')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    const url = new URL('/onboarding/error', request.url)
    return NextResponse.redirect(url)
  }

  if (invitation.accepted_at || new Date(invitation.expires_at) < new Date()) {
    const url = new URL('/onboarding/error', request.url)
    return NextResponse.redirect(url)
  }

  const { error: confirmError } = await serviceDb.auth.admin.updateUserById(invitation.user_id, {
    email_confirm: true,
  })
  if (confirmError) {
    const url = new URL('/onboarding/error', request.url)
    return NextResponse.redirect(url)
  }

  const { data: linkData, error: linkError } = await serviceDb.auth.admin.generateLink({
    type: 'magiclink',
    email: invitation.email,
  })
  if (linkError || !linkData) {
    const url = new URL('/onboarding/error', request.url)
    return NextResponse.redirect(url)
  }

  const sessionDb = await getDatabase()
  const { error: otpError } = await sessionDb.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  })
  if (otpError) {
    const url = new URL('/onboarding/error', request.url)
    return NextResponse.redirect(url)
  }

  await serviceDb.from('team_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)

  const { data: profile } = await serviceDb.from('users').select('onboarded_at').eq('id', invitation.user_id).single()

  if (profile?.onboarded_at) {
    return NextResponse.redirect(new URL(APP_ROOT, request.url))
  }

  return NextResponse.redirect(new URL(ONBOARDING_ROOT, request.url))
}
