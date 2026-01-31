'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { type Locale } from 'next-intl'

import { getAuthUser, updateAuthUser } from '@/actions/auth'
import { getDatabase } from '@/db/client'
import { CacheTag } from '@/lib/cache'
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
    await updateAuthUser({ password })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to set password' }
  }

  const db = await getDatabase()

  const username = [firstName, lastName]
    .filter(Boolean)
    .map(part => part.toLowerCase().replace(/\s+/g, ''))
    .join('.')

  const { error } = await db
    .from('users')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      username: username || null,
      birthday: birthday || null,
      phone: phone || null,
      locale: (locale as Locale) || null,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)

  if (error) return { error: error.message }

  revalidateTag(CacheTag.User, 'max')
  revalidateTag(CacheTag.AuthUser, 'max')
  revalidateTag(CacheTag.TeamMembers, 'max')
  redirect(APP_ROOT)
}
