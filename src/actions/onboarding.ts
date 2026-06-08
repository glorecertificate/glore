'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { and, eq, like, ne } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { getAuthUser, refreshAuthSession, setAuthPassword } from '@/actions/auth'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { CacheTag, userTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'

const uniqueUsername = async (base: string, userId: string) => {
  const taken = new Set(
    (
      await db.query.users.findMany({
        where: and(like(users.username, `${base}%`), ne(users.id, userId)),
        columns: { username: true },
      })
    ).map(row => row.username)
  )

  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}

export const completeOnboarding = async ({
  birthday,
  firstName,
  lastName,
  locale,
  password,
  phone,
}: {
  firstName: string
  lastName: string
  birthday: string
  phone: string
  password: string
  locale?: string
}) => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)

  try {
    await setAuthPassword(password)
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
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      username,
      birthday: birthday || null,
      phone: phone || null,
      locale: (locale as Locale) || null,
      onboardedAt: new Date().toISOString(),
    })
    .where(eq(users.id, authUser.id))

  await refreshAuthSession()

  revalidateTag(userTag(authUser.id), 'max')
  revalidateTag(CacheTag.AuthUser, 'max')
  revalidateTag(CacheTag.TeamMembers, 'max')

  return { error: null }
}
