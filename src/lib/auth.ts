import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin, username } from 'better-auth/plugins'

import { db } from '@/db/client'
import * as schema from '@/db/schema'
import { sendMail } from '@/lib/email'
import metadata from '~/config/metadata.json'

export const auth = betterAuth({
  appName: metadata.name,
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendMail({
        to: user.email,
        template: { name: 'auth/recovery', props: { url, userName: user.name || undefined } },
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
          template: { name: 'auth/verify-email', props: { url, userName: user.name || undefined } },
        })
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 7 * 24 * 60 * 60,
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
    nextCookies(),
  ],
})
