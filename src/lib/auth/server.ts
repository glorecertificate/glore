import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin, username } from 'better-auth/plugins'
import { createTransport } from 'nodemailer'

import { db } from '@/db/client'
import * as schema from '@/db/schema'

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const auth = betterAuth({
  appName: 'GloRe Certificate',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await transporter.sendMail({
        from: process.env.SMTP_SENDER,
        to: user.email,
        subject: 'Reset your password — GloRe Certificate',
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
      })
    },
  },
  user: {
    modelName: 'users',
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
      isEditor: { type: 'boolean', required: false, input: true, defaultValue: false },
      onboardedAt: { type: 'string', required: false, input: true },
    },
    changeEmail: {
      enabled: true,
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
