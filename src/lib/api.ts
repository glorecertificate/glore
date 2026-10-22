import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { readLimitedBody } from '@/lib/http'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_JSON_BODY_LENGTH = 256 * 1024

const deny = (error: string, status: number) => ({ response: NextResponse.json({ error }, { status }), user: null })

export const authorizeEditorRequest = async (request: NextRequest, scope: string, maxPerMinute: number) => {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } })
  const user = session?.user
  if (!user || user.banned) return deny('Unauthorized', 401)
  if (user.role !== 'admin' && !user.isEditor) return deny('Forbidden', 403)

  const { limited } = await checkRateLimit(`${scope}:${user.id}`, maxPerMinute, 60_000)
  if (limited) return deny('Too many requests', 429)

  return { response: null, user }
}

export const readJsonBody = async (request: NextRequest): Promise<unknown> => {
  const { bytes } = await readLimitedBody(request.body, MAX_JSON_BODY_LENGTH)
  if (!bytes) return null
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
