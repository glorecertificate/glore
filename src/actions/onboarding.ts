'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { and, eq, like, ne } from 'drizzle-orm'
import { type Locale } from 'next-intl'
import { z } from 'zod'

import { getAuthUser, refreshAuthSession } from '@/actions/auth'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag, userTag } from '@/lib/cache'
import { AUTH_ROOT, PASSWORD_REGEX } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'

const onboardingSchema = z.object({
  birthday: z.union([z.iso.date(), z.literal('')]),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100),
  locale: z.enum(LOCALES).optional(),
  password: z.string().min(8).max(128).regex(PASSWORD_REGEX),
  phone: z.string().trim().max(40),
})

const setCredentialPassword = async (userId: string, value: string) => {
  const { internalAdapter, password } = await auth.$context
  const passwordHash = await password.hash(value)
  const credential = (await internalAdapter.findAccounts(userId)).find(
    account => account.providerId === 'credential' && account.password
  )

  if (credential) {
    await internalAdapter.updatePassword(userId, passwordHash)
    return
  }

  await internalAdapter.linkAccount({ accountId: userId, providerId: 'credential', password: passwordHash, userId })
}

const escapeLike = (value: string) => value.replace(/[\\%_]/gu, match => `\\${match}`)

const uniqueUsername = async (base: string, userId: string) => {
  const taken = new Set(
    (
      await db.query.users.findMany({
        where: and(like(users.username, `${escapeLike(base)}%`), ne(users.id, userId)),
        columns: { username: true },
      })
    ).map(row => row.username)
  )

  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}

export const completeOnboarding = async (values: {
  firstName: string
  lastName: string
  birthday: string
  phone: string
  password: string
  locale?: string
}) => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)

  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid onboarding data' }

  const current = await db.query.users.findFirst({
    columns: { onboardedAt: true },
    where: eq(users.id, authUser.id),
  })
  if (!current) redirect(AUTH_ROOT)
  if (current.onboardedAt) return { error: 'Already onboarded' }

  const { birthday, firstName, lastName, locale, password, phone } = parsed.data

  try {
    await setCredentialPassword(authUser.id, password)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to set password' }
  }

  const usernameParts: string[] = []
  for (const part of [firstName, lastName]) {
    if (part) usernameParts.push(part.toLowerCase().replace(/\s+/gu, ''))
  }
  const baseUsername = usernameParts.join('.')
  const username = baseUsername ? await uniqueUsername(baseUsername, authUser.id) : null

  await db
    .update(users)
    .set({
      firstName,
      lastName: lastName || null,
      username,
      birthday: birthday || null,
      phone: phone || null,
      locale: (locale as Locale | undefined) ?? null,
      onboardedAt: new Date().toISOString(),
    })
    .where(eq(users.id, authUser.id))

  await refreshAuthSession()

  revalidateTag(userTag(authUser.id), 'max')
  revalidateTag(CacheTag.TeamMembers, 'max')

  return { error: null }
}
