'use server'

import 'server-only'

import { headers } from 'next/headers'
import { redirect, unstable_rethrow } from 'next/navigation'
import { cache } from 'react'

import { eq, or } from 'drizzle-orm'

import { db } from '@/db/client'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'

const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000

export const getAuthUser = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
    return session?.user ?? null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
})

const findLoginEmail = async (username: string) => {
  const identifier = username.trim().toLowerCase()
  if (!identifier || identifier.length > 254) return null
  const user = await db.query.users.findFirst({
    columns: { email: true },
    where: or(eq(users.email, identifier), eq(users.username, identifier)),
  })
  return user?.email ?? null
}

const isAuthRateLimited = async (scope: string, identifier: string, max: number) => {
  const address = await clientAddress()
  const [byAddress, byIdentifier] = await Promise.all([
    isRateLimited(`${scope}:ip:${address}`, max * 4, AUTH_RATE_LIMIT_WINDOW),
    isRateLimited(`${scope}:id:${identifier.trim().toLowerCase().slice(0, 254)}`, max, AUTH_RATE_LIMIT_WINDOW),
  ])
  return byAddress || byIdentifier
}

export const login = async ({ password, username }: { password: string; username: string }) => {
  if (await isAuthRateLimited('login', username, 10)) {
    return { error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
  }

  const email = await findLoginEmail(username)
  if (!email) return { error: { code: 'AUTH_ERROR', message: 'Login failed' } }

  try {
    const result = await auth.api.signInEmail({ body: { email, password } })
    if (!result?.user) return { error: { code: 'AUTH_ERROR', message: 'Login failed' } }
  } catch {
    return { error: { code: 'AUTH_ERROR', message: 'Login failed' } }
  }

  redirect(APP_ROOT)
}

export const logout = async () => {
  await auth.api.signOut({ headers: await headers() })
}

export const refreshAuthSession = async () => {
  await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  })
}

export const resetPassword = async (username: string) => {
  if (await isAuthRateLimited('reset', username, 3)) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
  }

  const email = await findLoginEmail(username)
  if (!email) return { data: {}, error: null }

  try {
    await auth.api.requestPasswordReset({ body: { email, redirectTo: `${process.env.APP_URL}${AUTH_ROOT}` } })
    return { data: {}, error: null }
  } catch {
    return { data: null, error: { code: 'AUTH_ERROR', message: 'Failed to send reset email' } }
  }
}

export const updatePassword = async (token: string, password: string) => {
  try {
    await auth.api.resetPassword({
      body: {
        newPassword: password,
        token,
      },
    })
    return { data: {}, error: null }
  } catch (e) {
    return {
      data: null,
      error: {
        code: e instanceof Error && 'code' in e ? (e as { code: string }).code : 'AUTH_ERROR',
        message: e instanceof Error ? e.message : 'Failed to update password',
      },
    }
  }
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('User not found')

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    })
  } catch (e) {
    return { error: { code: 'AUTH_ERROR', message: e instanceof Error ? e.message : 'Invalid current password' } }
  }

  await sendMail({
    to: session.user.email,
    template: { name: 'account/password-changed', props: { userName: session.user.name || undefined } },
  })

  return { data: session.user }
}
