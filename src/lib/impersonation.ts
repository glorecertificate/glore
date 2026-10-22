import 'server-only'

import { type GenericEndpointContext } from 'better-auth'
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
  sessionMiddleware,
} from 'better-auth/api'
import { deleteSessionCookie, expireCookie, setSessionCookie } from 'better-auth/cookies'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { type Transaction, db, transaction } from '@/db/client'
import { type AppEvent, eventMetadata, eventSubject } from '@/db/queries/activity-event'
import { type ImpersonationErrorCode, adminReasonSchema, isBanActive } from '@/db/queries/admin-user'
import { activityEvents } from '@/db/schema/activity-events'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'
import appConfig from '~/config/app.json'

const ADMIN_COOKIE = 'admin_session'
const DURATION_SECONDS = appConfig.impersonationMinutes * 60
const COOKIE_GRACE_SECONDS = 120

const ACCESS_COLUMNS = {
  banExpires: users.banExpires,
  banned: users.banned,
  id: users.id,
  onboardedAt: users.onboardedAt,
  role: users.role,
}

const BLOCKED_PATHS = new Set([
  '/change-email',
  '/change-password',
  '/delete-user',
  '/link-social',
  '/revoke-other-sessions',
  '/revoke-session',
  '/revoke-sessions',
  '/set-password',
  '/unlink-account',
])

const MESSAGES = {
  ALREADY_IMPERSONATING: 'Stop the current impersonation first',
  CANNOT_IMPERSONATE_ADMINS: 'Platform admins cannot be impersonated',
  CANNOT_IMPERSONATE_SELF: 'You cannot impersonate yourself',
  FORBIDDEN: 'Only platform admins can impersonate users',
  NOT_ALLOWED_WHILE_IMPERSONATING: 'This action is not available while viewing as another user',
  NOT_IMPERSONATING: 'You are not impersonating anyone',
  NOT_ONBOARDED: 'This user has not finished onboarding',
  TARGET_BANNED: 'Banned users cannot be impersonated',
  USER_NOT_FOUND: 'User not found',
} satisfies Record<ImpersonationErrorCode, string>

const fail = (status: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND', code: ImpersonationErrorCode) =>
  APIError.from(status, { code, message: MESSAGES[code] })

const audit = async (event: AppEvent, executor: Transaction | typeof db = db) => {
  const subject = eventSubject(event)
  await executor.insert(activityEvents).values({
    action: event.type,
    actorId: event.actorId,
    metadata: eventMetadata(event),
    organizationId: event.organizationId,
    subjectId: subject.id,
    subjectType: subject.type,
  })
}

const adminCookie = (ctx: GenericEndpointContext) =>
  ctx.context.createAuthCookie(ADMIN_COOKIE, { maxAge: DURATION_SECONDS + COOKIE_GRACE_SECONDS })

const readAdminCookie = async (ctx: GenericEndpointContext) => {
  const value = await ctx.getSignedCookie(adminCookie(ctx).name, ctx.context.secret)
  if (!value) return null
  const [adminToken, dontRemember, sessionId] = value.split(':')
  if (!(adminToken && sessionId)) return null
  return { adminToken, dontRemember: dontRemember === '1', sessionId }
}

const readCurrentSession = async (ctx: GenericEndpointContext) => {
  try {
    const current = await getSessionFromCtx(ctx, { disableRefresh: true })
    if (!current || new Date(current.session.expiresAt).getTime() <= Date.now()) return null
    return current
  } catch {
    return null
  }
}

const resolveImpersonation = async (ctx: GenericEndpointContext) => {
  const cookie = await readAdminCookie(ctx)
  if (!cookie) return null
  const current = await readCurrentSession(ctx)
  return { cookie, current, matches: current?.session.id === cookie.sessionId }
}

const findStart = async (adminId: string, sessionId: string) => {
  const [started] = await db
    .select({ metadata: activityEvents.metadata, userId: activityEvents.subjectId })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.actorId, adminId),
        eq(activityEvents.action, 'impersonation.started'),
        sql`${activityEvents.metadata}->>'sessionId' = ${sessionId}`
      )
    )
    .limit(1)
  const reason = started?.metadata.reason
  return { reason: typeof reason === 'string' ? reason : '', userId: started?.userId ?? '' }
}

const closeSession = async (adminId: string, sessionId: string) => {
  const started = await findStart(adminId, sessionId)
  await transaction(async tx => {
    await audit(
      {
        actorId: adminId,
        data: { reason: started.reason, sessionId, userId: started.userId },
        organizationId: null,
        type: 'impersonation.stopped',
      },
      tx
    )
    await tx.delete(sessions).where(eq(sessions.id, sessionId))
  })
}

export const impersonation = () => ({
  id: 'impersonation',
  hooks: {
    before: [
      {
        matcher: (context: { path?: string }) => BLOCKED_PATHS.has(context.path ?? ''),
        handler: createAuthMiddleware(async ctx => {
          const state = await resolveImpersonation(ctx)
          if (state?.matches) throw fail('FORBIDDEN', 'NOT_ALLOWED_WHILE_IMPERSONATING')
        }),
      },
    ],
    after: [
      {
        matcher: (context: { path?: string }) => context.path === '/sign-out',
        handler: createAuthMiddleware(ctx => Promise.resolve(expireCookie(ctx, adminCookie(ctx)))),
      },
    ],
  },
  endpoints: {
    startImpersonation: createAuthEndpoint(
      '/impersonation/start',
      {
        body: z.object({ reason: adminReasonSchema, userId: z.string().min(1).max(200) }),
        method: 'POST',
        metadata: { SERVER_ONLY: true },
        use: [sessionMiddleware],
      },
      async ctx => {
        const { internalAdapter } = ctx.context
        const { session: adminSession } = ctx.context.session

        const [admin] = await db.select(ACCESS_COLUMNS).from(users).where(eq(users.id, adminSession.userId))
        if (!admin || admin.role !== 'admin' || isBanActive(admin)) throw fail('FORBIDDEN', 'FORBIDDEN')
        if (await readAdminCookie(ctx)) throw fail('BAD_REQUEST', 'ALREADY_IMPERSONATING')

        const [row] = await db.select(ACCESS_COLUMNS).from(users).where(eq(users.id, ctx.body.userId))
        const target = row ? await internalAdapter.findUserById(row.id) : null
        if (!(row && target)) throw fail('NOT_FOUND', 'USER_NOT_FOUND')
        if (row.id === admin.id) throw fail('BAD_REQUEST', 'CANNOT_IMPERSONATE_SELF')
        if (row.role === 'admin') throw fail('FORBIDDEN', 'CANNOT_IMPERSONATE_ADMINS')
        if (isBanActive(row)) throw fail('FORBIDDEN', 'TARGET_BANNED')
        if (!row.onboardedAt) throw fail('BAD_REQUEST', 'NOT_ONBOARDED')

        const expiresAt = new Date(Date.now() + DURATION_SECONDS * 1000)
        const session = await internalAdapter.createSession(target.id, true, { expiresAt }, true)

        try {
          await audit({
            actorId: adminSession.userId,
            data: {
              expiresAt: expiresAt.toISOString(),
              reason: ctx.body.reason,
              sessionId: session.id,
              userId: target.id,
            },
            organizationId: null,
            type: 'impersonation.started',
          })
        } catch (error) {
          await internalAdapter.deleteSession(session.token)
          throw error
        }

        const dontRemember = await ctx.getSignedCookie(
          ctx.context.authCookies.dontRememberToken.name,
          ctx.context.secret
        )
        const cookie = adminCookie(ctx)
        deleteSessionCookie(ctx)
        await ctx.setSignedCookie(
          cookie.name,
          `${adminSession.token}:${dontRemember ? '1' : ''}:${session.id}`,
          ctx.context.secret,
          cookie.attributes
        )
        await setSessionCookie(ctx, { session, user: target }, true)

        return ctx.json({ expiresAt: expiresAt.toISOString(), sessionId: session.id, userId: target.id })
      }
    ),
    stopImpersonation: createAuthEndpoint(
      '/impersonation/stop',
      { method: 'POST', metadata: { SERVER_ONLY: true }, requireHeaders: true },
      async ctx => {
        const state = await resolveImpersonation(ctx)
        if (!state) throw fail('BAD_REQUEST', 'NOT_IMPERSONATING')
        if (state.current && !state.matches) throw fail('BAD_REQUEST', 'NOT_IMPERSONATING')

        const { internalAdapter } = ctx.context
        const adminSession = await internalAdapter.findSession(state.cookie.adminToken)
        const valid =
          adminSession &&
          adminSession.user.role === 'admin' &&
          !adminSession.user.banned &&
          new Date(adminSession.session.expiresAt).getTime() > Date.now()

        if (!valid) {
          await db.delete(sessions).where(eq(sessions.id, state.cookie.sessionId))
          throw fail('BAD_REQUEST', 'NOT_IMPERSONATING')
        }

        await closeSession(adminSession.user.id, state.cookie.sessionId)

        deleteSessionCookie(ctx)
        expireCookie(ctx, adminCookie(ctx))
        await setSessionCookie(ctx, adminSession, state.cookie.dontRemember)

        return ctx.json({ sessionId: state.cookie.sessionId })
      }
    ),
    getImpersonation: createAuthEndpoint(
      '/impersonation/current',
      { method: 'GET', metadata: { SERVER_ONLY: true }, requireHeaders: true },
      async ctx => {
        const state = await resolveImpersonation(ctx)
        if (!state?.current || !state.matches) return ctx.json(null)

        const adminSession = await ctx.context.internalAdapter.findSession(state.cookie.adminToken)
        if (!adminSession || adminSession.user.role !== 'admin') return ctx.json(null)

        const started = await findStart(adminSession.user.id, state.cookie.sessionId)
        return ctx.json({
          adminId: adminSession.user.id,
          expiresAt: new Date(state.current.session.expiresAt).toISOString(),
          reason: started.reason,
          sessionId: state.current.session.id,
          userId: state.current.user.id,
        })
      }
    ),
  },
})
