'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { and, eq, like, ne } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser, refreshAuthSession } from '@/actions/auth'
import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { completeOnboardingProfile } from '@/db/mutations/user'
import { type AppEvent } from '@/db/queries/activity-event'
import { onboardingNextStep } from '@/db/queries/onboarding'
import { memberships, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag, userTag } from '@/lib/cache'
import { AUTH_ROOT, PASSWORD_REGEX } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'
import { pickUsername, usernameBase } from '@/lib/username'
import { fullName } from '@/lib/utils'

const isoDate = z.iso.date().refine(value => value <= new Date().toISOString().slice(0, 10) && value >= '1900-01-01')

const onboardingSchema = z.object({
  birthPlace: z.string().trim().min(1).max(100),
  birthday: isoDate,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  locale: z.enum(LOCALES).optional(),
  nationality: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/u)
    .toLowerCase(),
  password: z.string().min(8).max(128).regex(PASSWORD_REGEX),
  phone: z.string().trim().max(40),
})

export type OnboardingValues = z.input<typeof onboardingSchema>

export type OnboardingError = 'ALREADY_ONBOARDED' | 'FAILED' | 'INVALID'

const failure = (code: OnboardingError) => ({ data: null, error: { code } })

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

const availableUsername = async (base: string, userId: string) => {
  const rows = await db.query.users.findMany({
    columns: { username: true },
    where: and(like(users.username, `${escapeLike(base)}%`), ne(users.id, userId)),
  })
  return pickUsername(base, new Set(rows.flatMap(({ username }) => (username ? [username] : []))))
}

export const completeOnboarding = async (values: OnboardingValues) => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)

  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return failure('INVALID')

  const current = await db.query.users.findFirst({
    columns: { onboardedAt: true },
    where: eq(users.id, authUser.id),
  })
  if (!current) redirect(AUTH_ROOT)
  if (current.onboardedAt) return failure('ALREADY_ONBOARDED')

  const { birthPlace, birthday, firstName, lastName, locale, nationality, password, phone } = parsed.data

  try {
    await setCredentialPassword(authUser.id, password)
    const username = await availableUsername(usernameBase(firstName, lastName), authUser.id)
    const event = {
      actorId: authUser.id,
      data: { userId: authUser.id },
      organizationId: null,
      type: 'account.welcome',
    } satisfies AppEvent<'account.welcome'>

    const completed = await transaction(async tx => {
      const row = await completeOnboardingProfile(tx, authUser.id, {
        birthPlace,
        birthday,
        firstName,
        lastName,
        locale: locale ?? null,
        name: fullName({ firstName, lastName }),
        nationality,
        phone: phone || null,
        username,
      })
      if (!row) return false
      await recordEvent(tx, event)
      return true
    })
    if (!completed) return failure('ALREADY_ONBOARDED')

    await refreshAuthSession()
    revalidateTag(userTag(authUser.id), 'max')
    revalidateTag(CacheTag.TeamMembers, 'max')
    await notify(event)

    const roles = await db.query.memberships.findMany({
      columns: { role: true },
      where: eq(memberships.userId, authUser.id),
    })
    return { data: { nextStep: onboardingNextStep(roles.map(({ role }) => role)), username }, error: null }
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    return failure('FAILED')
  }
}
