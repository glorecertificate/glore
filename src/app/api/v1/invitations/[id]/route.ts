import { NextResponse } from 'next/server'

import { getAuthUser } from '@/actions/auth'
import { transaction } from '@/db/client'
import { invitationUrl, isInvitationError, openRecipientInvitation } from '@/db/mutations/invitation'
import { AUTH_ROOT, INVITE_ROOT } from '@/lib/constants'

const redirectTo = (url: string | URL) => {
  const response = NextResponse.redirect(new URL(url, process.env.APP_URL))
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getAuthUser()
  if (!user || user.banned) return redirectTo(AUTH_ROOT)

  const invitationId = Number((await params).id)
  if (!Number.isInteger(invitationId) || invitationId <= 0) return redirectTo(`${INVITE_ROOT}/unknown`)

  try {
    const token = await transaction(tx => openRecipientInvitation(tx, { invitationId, user }))
    return redirectTo(invitationUrl(token))
  } catch (e) {
    if (!isInvitationError(e)) throw e
    return redirectTo(`${INVITE_ROOT}/unknown`)
  }
}
