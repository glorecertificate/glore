import 'server-only'

import { revalidateTag } from 'next/cache'
import { after } from 'next/server'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthEndpoint, getSessionFromCtx } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { nextCookies } from 'better-auth/next-js'
import { admin, username } from 'better-auth/plugins'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { accounts } from '@/db/schema/accounts'
import { rateLimits } from '@/db/schema/rate-limits'
import { sessions } from '@/db/schema/sessions'
import { teamInvitations } from '@/db/schema/teams'
import { users } from '@/db/schema/users'
import { verifications } from '@/db/schema/verifications'
import { CacheTag, userTag } from '@/lib/cache'
import { APP_ROOT, AUTH_LINK_EXPIRY_SECONDS, ONBOARDING_ERROR_ROOT, ONBOARDING_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { impersonationGuard } from '@/lib/impersonation-guard'
import { hashToken } from '@/lib/secret-token'
import appConfig from '~/config/app.json'
import metadata from '~/config/metadata.json'

const afterResponse = async (task: () => Promise<void>) => {
  try {
    after(task)
  } catch {
    await task()
  }
}

const sendAfterResponse = (label: string, options: Parameters<typeof sendMail>[0]) =>
  afterResponse(async () => {
    try {
      await sendMail(options)
    } catch (e) {
      console.error(`[auth] failed to send ${label}`, e instanceof Error ? e.message : e)
    }
  })

const expireUserCache = (user: unknown) => {
  const id = typeof user === 'object' && user !== null && 'id' in user ? user.id : null
  if (typeof id !== 'string') return
  try {
    revalidateTag(userTag(id), { expire: 0 })
  } catch (e) {
    console.warn('[auth] could not expire the cached user', e instanceof Error ? e.message : e)
  }
}

const teamInvitationsPlugin = () => ({
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
          where: eq(teamInvitations.tokenHash, hashToken(token)),
        })
        if (!invitation) return redirectTo(ONBOARDING_ERROR_ROOT)
        if (invitation.acceptedAt || new Date(invitation.expiresAt) < new Date()) {
          return redirectTo(ONBOARDING_ERROR_ROOT)
        }

        const existing = await getSessionFromCtx(ctx, { disableRefresh: true }).catch(() => null)
        if (existing?.user && existing.user.id !== invitation.userId) return redirectTo(ONBOARDING_ERROR_ROOT)

        const user = await ctx.context.internalAdapter.findUserById(invitation.userId)
        if (!user) return redirectTo(ONBOARDING_ERROR_ROOT)

        const [accepted] = await db
          .update(teamInvitations)
          .set({ acceptedAt: new Date().toISOString() })
          .where(and(eq(teamInvitations.id, invitation.id), isNull(teamInvitations.acceptedAt)))
          .returning({ id: teamInvitations.id })
        if (!accepted) return redirectTo(ONBOARDING_ERROR_ROOT)
        revalidateTag(CacheTag.TeamMembers, { expire: 0 })

        const session = await ctx.context.internalAdapter.createSession(user.id)
        if (!session) return redirectTo(ONBOARDING_ERROR_ROOT)

        await setSessionCookie(ctx, { session, user })

        const onboardedAt = (user as { onboardedAt?: string | null }).onboardedAt
        return redirectTo(onboardedAt ? APP_ROOT : ONBOARDING_ROOT)
      }
    ),
  },
})

export const auth = betterAuth({
  appName: metadata.name,
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      accounts,
      rateLimits,
      sessions,
      users,
      verifications,
    },
    usePlural: true,
  }),
  disabledPaths: ['/sign-up/email', '/sign-in/email', '/sign-in/username', '/update-user'],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: AUTH_LINK_EXPIRY_SECONDS,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendAfterResponse('recovery email', {
        to: user.email,
        template: { name: 'auth/recovery', props: { url, userName: user.name || undefined } },
      })
    },
    async onPasswordReset({ user }) {
      await sendAfterResponse('password changed email', {
        to: user.email,
        template: { name: 'account/password-changed', props: { userName: user.name || undefined } },
      })
    },
  },
  databaseHooks: {
    user: {
      update: {
        after: user => Promise.resolve(expireUserCache(user)),
      },
    },
  },
  user: {
    fields: {
      image: 'avatarUrl',
    },
    additionalFields: {
      firstName: { type: 'string', required: true, input: true },
      lastName: { type: 'string', required: false, input: true },
      phone: { type: 'string', required: false, input: true },
      bio: { type: 'string', required: false, input: true },
      birthday: { type: 'string', required: false, input: true },
      sex: { type: 'string', required: false, input: true },
      pronouns: { type: 'string', required: false, input: true },
      country: { type: 'string', required: false, input: true },
      city: { type: 'string', required: false, input: true },
      locale: { type: 'string', required: false, input: true },
      isEditor: { type: 'boolean', required: false, input: false, defaultValue: false },
      onboardedAt: { type: 'string', required: false, input: false },
    },
    changeEmail: {
      enabled: true,
    },
  },
  emailVerification: {
    expiresIn: AUTH_LINK_EXPIRY_SECONDS,
    async sendVerificationEmail({ user, url }) {
      await sendMail({
        to: user.email,
        template: {
          name: 'auth/verify-email',
          props: {
            url,
            userName: user.name || undefined,
          },
        },
      })
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: 'database',
    customRules: {
      '/request-password-reset': { window: 60, max: 3 },
      '/reset-password': { window: 60, max: 3 },
      '/change-password': { window: 60, max: 5 },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 7 * 24 * 60 * 60,
  },
  logger: {
    log: (level, message, error, ...args) => {
      const isAbortError =
        error?.cause?.sourceError?.name === 'AbortError' || error?.cause?.message?.includes?.('AbortError')
      if (level === 'error' && isAbortError) return
      console[level](`${new Date().toISOString()} ${level.toUpperCase()} [Better Auth]: ${message}`, ...args)
    },
  },
  advanced: {
    cookiePrefix: 'gl',
    generateId: () => crypto.randomUUID(),
  },
  plugins: [
    username({
      minUsernameLength: 3,
    }),
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      allowImpersonatingAdmins: false,
      impersonationSessionDuration: appConfig.impersonationMinutes * 60,
    }),
    teamInvitationsPlugin(),
    impersonationGuard(),
    nextCookies(),
  ],
})
