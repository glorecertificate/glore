import 'server-only'

import { createAuthEndpoint, getSessionFromCtx } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { teamInvitations } from '@/db/schema'
import { APP_ROOT, ONBOARDING_ERROR_ROOT, ONBOARDING_ROOT } from '@/lib/constants'

export const teamInvitationsPlugin = () => ({
  id: 'team-invitations',
  endpoints: {
    acceptInvitation: createAuthEndpoint(
      '/accept-invitation',
      {
        method: 'GET',
        query: z.object({ token: z.string().optional() }),
      },
      async ctx => {
        const redirectTo = (path: string): never => {
          throw ctx.redirect(new URL(path, process.env.APP_URL).toString())
        }

        const token = ctx.query?.token
        if (!token) return redirectTo(ONBOARDING_ERROR_ROOT)

        const invitation = await db.query.teamInvitations.findFirst({
          columns: { id: true, userId: true, expiresAt: true, acceptedAt: true },
          where: eq(teamInvitations.token, token),
        })
        if (!invitation) return redirectTo(ONBOARDING_ERROR_ROOT)
        if (invitation.acceptedAt || new Date(invitation.expiresAt) < new Date()) {
          return redirectTo(ONBOARDING_ERROR_ROOT)
        }

        const existing = await getSessionFromCtx(ctx, { disableRefresh: true }).catch(() => null)
        if (existing?.user && existing.user.id !== invitation.userId) return redirectTo(ONBOARDING_ERROR_ROOT)

        const user = await ctx.context.internalAdapter.findUserById(invitation.userId)
        if (!user) return redirectTo(ONBOARDING_ERROR_ROOT)

        await db
          .update(teamInvitations)
          .set({ acceptedAt: new Date().toISOString() })
          .where(eq(teamInvitations.id, invitation.id))

        const session = await ctx.context.internalAdapter.createSession(user.id)
        if (!session) return redirectTo(ONBOARDING_ERROR_ROOT)

        await setSessionCookie(ctx, { session, user })

        const onboardedAt = (user as { onboardedAt?: string | null }).onboardedAt
        return redirectTo(onboardedAt ? APP_ROOT : ONBOARDING_ROOT)
      }
    ),
  },
})
