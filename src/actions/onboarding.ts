'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { getAuthUser, setAuthPassword } from '@/actions/auth'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { CacheTag, userTag } from '@/lib/cache'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

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
    if (part) usernameParts.push(part.toLowerCase().replace(/\s+/g, ''))
  }
  const username = usernameParts.join('.')

  await db
    .update(users)
    .set({
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      username: username || null,
      birthday: birthday || null,
      phone: phone || null,
      locale: (locale as Locale) || null,
      onboardedAt: new Date().toISOString(),
    })
    .where(eq(users.id, authUser.id))

  revalidateTag(userTag(authUser.id), 'max')
  revalidateTag(CacheTag.AuthUser, 'max')
  revalidateTag(CacheTag.TeamMembers, 'max')
  redirect(APP_ROOT)
}
