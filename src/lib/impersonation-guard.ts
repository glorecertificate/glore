import 'server-only'

import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { expireCookie } from 'better-auth/cookies'

const ADMIN_COOKIE = 'admin_session'

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

export const impersonationGuard = () => ({
  id: 'impersonation-guard',
  hooks: {
    before: [
      {
        matcher: (context: { path?: string }) => BLOCKED_PATHS.has(context.path ?? ''),
        handler: createAuthMiddleware(async ctx => {
          const current = await getSessionFromCtx(ctx, { disableRefresh: true }).catch(() => null)
          if (!current?.session.impersonatedBy) return
          throw APIError.from('FORBIDDEN', {
            code: 'NOT_ALLOWED_WHILE_IMPERSONATING',
            message: 'This action is not available while viewing as another user',
          })
        }),
      },
    ],
    after: [
      {
        matcher: (context: { path?: string }) => context.path === '/sign-out',
        handler: createAuthMiddleware(ctx =>
          Promise.resolve(expireCookie(ctx, ctx.context.createAuthCookie(ADMIN_COOKIE)))
        ),
      },
    ],
  },
})
