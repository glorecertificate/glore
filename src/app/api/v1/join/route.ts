import { type NextRequest, NextResponse } from 'next/server'

import { ACCEPT_INVITATION_ROOT, ONBOARDING_ERROR_ROOT } from '@/lib/constants'

export const GET = (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL(ONBOARDING_ERROR_ROOT, process.env.APP_URL))

  const target = new URL(ACCEPT_INVITATION_ROOT, process.env.APP_URL)
  target.searchParams.set('token', token)
  return NextResponse.redirect(target)
}
