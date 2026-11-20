import { type NextRequest } from 'next/server'

import { lookupLegacyCertificateCode } from '@/actions/certificates/queries'
import { VERIFY_ROOT } from '@/lib/constants'

export const GET = async (request: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
  const { username } = await params
  const handle = request.nextUrl.searchParams.get('v')
  if (!handle) return new Response(null, { status: 404 })

  const code = await lookupLegacyCertificateCode(username, handle)
  if (!code) return new Response(null, { status: 404 })

  return Response.redirect(`${process.env.APP_URL}${VERIFY_ROOT}/${code}`, 308)
}
