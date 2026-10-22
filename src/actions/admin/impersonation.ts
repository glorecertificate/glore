'use server'

import 'server-only'

import { headers } from 'next/headers'

import { eq } from 'drizzle-orm'

import { adminAction, requireAdminWithLimit } from '@/actions/admin/helpers'
import { isImpersonating, readImpersonation } from '@/actions/admin/impersonation-state'
import { db, transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { assertCanImpersonate, impersonationError } from '@/db/mutations/impersonation'
import { adminError } from '@/db/mutations/moderation'
import { type ImpersonationInput, impersonationInputSchema } from '@/db/queries/admin-user'
import { sessions } from '@/db/schema/sessions'
import { auth } from '@/lib/auth'

const COOKIE_PAIR = /^([^=]*)=(.*)$/u

const withCookies = (requestHeaders: Headers, response: Headers) => {
  const jar = new Map(
    (requestHeaders.get('cookie') ?? '')
      .split('; ')
      .map(pair => COOKIE_PAIR.exec(pair))
      .flatMap(match => (match ? [[match[1] ?? '', match[2] ?? ''] as const] : []))
  )
  for (const line of response.getSetCookie()) {
    const [pair = '', ...attributes] = line.split(';')
    const [, name = '', value = ''] = COOKIE_PAIR.exec(pair) ?? []
    const expired = !value || attributes.some(attribute => /max-age=0/iu.test(attribute))
    if (expired) {
      jar.delete(name)
      continue
    }
    jar.set(name, value)
  }
  return new Headers({ cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') })
}

const endSession = async (requestHeaders: Headers, sessionId: string) => {
  try {
    await auth.api.signOut({ headers: requestHeaders })
  } catch {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }
}

export const startImpersonation = async (input: ImpersonationInput) =>
  await adminAction(async () => {
    if (await isImpersonating()) throw impersonationError('BAD_REQUEST', 'ALREADY_IMPERSONATING')
    const admin = await requireAdminWithLimit('impersonate', 20)
    const parsed = impersonationInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { reason, userId } = parsed.data
    await assertCanImpersonate({ adminId: admin.id, userId })

    const requestHeaders = await headers()
    const { headers: responseHeaders, response } = await auth.api.impersonateUser({
      body: { userId },
      headers: requestHeaders,
      returnHeaders: true,
    })
    const { session } = response
    const expiresAt = new Date(session.expiresAt).toISOString()

    try {
      await transaction(
        async tx =>
          await recordEvent(tx, {
            actorId: admin.id,
            data: { expiresAt, reason, sessionId: session.id, userId },
            organizationId: null,
            type: 'impersonation.started',
          })
      )
    } catch (error) {
      const viewing = withCookies(requestHeaders, responseHeaders)
      try {
        await auth.api.stopImpersonating({ headers: viewing })
      } catch {
        await endSession(viewing, session.id)
      }
      throw error
    }

    return { expiresAt, sessionId: session.id, userId }
  })

export const stopImpersonation = async () =>
  await adminAction(async () => {
    const state = await readImpersonation()
    if (!state) throw impersonationError('BAD_REQUEST', 'NOT_IMPERSONATING')

    await transaction(
      async tx =>
        await recordEvent(tx, {
          actorId: state.adminId,
          data: { reason: state.reason, sessionId: state.sessionId, userId: state.userId },
          organizationId: null,
          type: 'impersonation.stopped',
        })
    )

    const requestHeaders = await headers()
    try {
      await auth.api.stopImpersonating({ headers: requestHeaders })
    } catch (error) {
      await endSession(requestHeaders, state.sessionId)
      throw error
    }

    return { sessionId: state.sessionId }
  })
