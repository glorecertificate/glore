import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthEndpoint, getSessionFromCtx } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { nextCookies } from 'better-auth/next-js'
import { admin, username } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { teamInvitations } from '@/db/schema'
import { accounts } from '@/db/schema/accounts'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'
import { verifications } from '@/db/schema/verifications'
import { APP_ROOT, ONBOARDING_ERROR_ROOT, ONBOARDING_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import metadata from '~/config/metadata.json'

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

export const auth = betterAuth({
  appName: metadata.name,
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      accounts,
      sessions,
      users,
      verifications,
    },
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    async sendResetPassword({ user, url }) {
      await sendMail({
        to: user.email,
        template: {
          name: 'auth/recovery',
          props: {
            url,
            userName: user.name || undefined,
          },
        },
      })
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
      async sendChangeEmailVerification({
        user,
        newEmail,
        url,
      }: {
        user: { name: string }
        newEmail: string
        url: string
      }) {
        await sendMail({
          to: newEmail,
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
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: 'memory',
    customRules: {
      '/api/auth/sign-in/email': { window: 60, max: 5 },
      '/api/auth/sign-up/email': { window: 60, max: 5 },
      '/api/auth/forget-password': { window: 60, max: 3 },
      '/api/auth/reset-password': { window: 60, max: 3 },
      '/api/auth/change-password': { window: 60, max: 5 },
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
    }),
    teamInvitationsPlugin(),
    nextCookies(),
  ],
})
