'use server'

import 'server-only'

import { cacheTag, revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { getCookie } from '@/actions/cookies'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { userTag } from '@/lib/cache'
import { AUTH_ROOT, SESSION_ROOT, SETTINGS_ROOT, USERNAME_REGEX } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { LOCALES } from '@/lib/i18n'
import { isReservedUsername } from '@/lib/username'

const USER_NOT_FOUND = 'User not found'

const isUniqueViolation = (error: unknown) =>
  (error instanceof Error && 'code' in error && error.code === '23505') ||
  (error instanceof Error && error.cause instanceof Error && 'code' in error.cause && error.cause.code === '23505')

const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: userWith,
  })
  if (!user) throw new Error(USER_NOT_FOUND)
  return parseUser(user)
}

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(() => queryUserById(id))
}

export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)

  const { data, error } = await fetchUser(authUser.id)
  if (error?.message === USER_NOT_FOUND) redirect(SESSION_ROOT)
  if (error || !data) throw new Error(error?.message ?? USER_NOT_FOUND)

  return data
})

export const findUser = async (id: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  if (!useCache) return await queryUserById(id)

  const { data, error } = await fetchUser(id)
  if (error || !data) throw new Error(error?.message ?? USER_NOT_FOUND)

  return data
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(value => value || null)
    .nullable()
    .optional()

const profileSchema = z.strictObject({
  bio: optionalText(1000),
  birthday: z
    .union([z.iso.date(), z.literal('')])
    .transform(value => value || null)
    .nullable()
    .optional(),
  city: optionalText(100),
  country: optionalText(3),
  firstName: z.string().trim().min(1).max(100).optional(),
  languages: z.array(z.string().max(10)).max(30).nullable().optional(),
  lastName: optionalText(100),
  phone: optionalText(40),
  pronouns: optionalText(40),
  sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).nullable().optional(),
})

const accountSchema = z.strictObject({
  email: z.email().trim().toLowerCase().optional(),
  locale: z.enum(LOCALES).nullable().optional(),
  username: z.string().trim().toLowerCase().min(3).max(40).regex(USERNAME_REGEX).optional(),
})

export const updateProfile = async (values: z.input<typeof profileSchema>) => {
  const currentUser = await getCurrentUser()
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid profile data')

  if (Object.keys(parsed.data).length > 0) {
    await db.update(users).set(parsed.data).where(eq(users.id, currentUser.id))
    revalidateTag(userTag(currentUser.id), 'max')
  }

  return await queryUserById(currentUser.id)
}

export const updateAccount = async (values: z.input<typeof accountSchema>) => {
  const currentUser = await getCurrentUser()
  const parsed = accountSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid account data')

  const { email, ...fields } = parsed.data

  if (fields.username && fields.username !== currentUser.username) {
    if (isReservedUsername(fields.username)) throw new Error('USERNAME_RESERVED')
    const taken = await db.query.users.findFirst({
      columns: { id: true },
      where: and(eq(users.username, fields.username), ne(users.id, currentUser.id)),
    })
    if (taken) throw new Error('USERNAME_TAKEN')
  }

  const pendingEmail = email && email !== currentUser.email ? email : null

  if (pendingEmail) {
    await auth.api.changeEmail({
      body: { newEmail: pendingEmail, callbackURL: SETTINGS_ROOT },
      headers: await headers(),
    })
    await sendMail({
      locale: currentUser.locale ?? undefined,
      to: currentUser.email,
      template: {
        name: 'account/email-changed',
        props: { newEmail: pendingEmail, oldEmail: currentUser.email, userName: currentUser.firstName },
      },
    })
  }

  if (Object.keys(fields).length > 0) {
    try {
      await db.update(users).set(fields).where(eq(users.id, currentUser.id))
    } catch (error) {
      if (fields.username && isUniqueViolation(error)) throw new Error('USERNAME_TAKEN', { cause: error })
      throw error
    }
    revalidateTag(userTag(currentUser.id), 'max')
  }

  return { pendingEmail, user: await queryUserById(currentUser.id) }
}

export const getActiveOrgId = async () => {
  const [user, stored] = await Promise.all([getCurrentUser(), getCookie('org')])
  const match = user.organizations.find(({ id }) => id === stored)
  return (match ?? user.organizations[0])?.id ?? null
}
