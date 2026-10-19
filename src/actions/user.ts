'use server'

import 'server-only'

import { cacheTag, revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { and, eq, inArray, ne } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { getCookie } from '@/actions/cookies'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { deleteUser } from '@/db/mutations/user'
import { parseUser, userWith } from '@/db/queries/user'
import { certificates, memberships, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { userTag } from '@/lib/cache'
import { AUTH_ROOT, SETTINGS_ROOT, USERNAME_REGEX } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { LOCALES } from '@/lib/i18n'

const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: userWith,
  })
  if (!user) throw new Error('User not found')
  return parseUser(user)
}

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(() => queryUserById(id))
}

export const getCurrentUser = cache(async () => {
  const user = await getAuthUser()
  if (!user) redirect(AUTH_ROOT)
  return await findUser(user.id)
})

export const findUser = async (id: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  if (!useCache) return await queryUserById(id)

  const { data, error } = await fetchUser(id)
  if (error || !data) throw new Error(error?.message ?? 'User not found')

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
    await db.update(users).set(fields).where(eq(users.id, currentUser.id))
    revalidateTag(userTag(currentUser.id), 'max')
  }

  return { pendingEmail, user: await queryUserById(currentUser.id) }
}

export const getActiveOrgId = async () => {
  const [user, stored] = await Promise.all([getCurrentUser(), getCookie('org')])
  const match = user.organizations.find(({ id }) => id === stored)
  return (match ?? user.organizations[0])?.id ?? null
}

export const deleteAccount = async () => {
  const user = await getCurrentUser()

  const adminMemberships = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.role, 'admin')))

  if (adminMemberships.length > 0) {
    const adminOrgIds = adminMemberships.map(m => m.organizationId)
    const orgsWithOtherAdmin = await db
      .selectDistinct({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(
        and(
          inArray(memberships.organizationId, adminOrgIds),
          eq(memberships.role, 'admin'),
          ne(memberships.userId, user.id)
        )
      )
    const covered = new Set(orgsWithOtherAdmin.map(m => m.organizationId))
    if (adminOrgIds.some(orgId => !covered.has(orgId))) throw new Error('SOLE_ORG_ADMIN')
  }

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.userId, user.id),
    columns: { id: true },
  })
  if (cert) throw new Error('HAS_CERTIFICATES')

  await transaction(tx => deleteUser(tx, user.id))

  redirect(AUTH_ROOT)
}
