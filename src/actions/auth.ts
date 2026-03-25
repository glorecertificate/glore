'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { and, desc, eq, ne } from 'drizzle-orm'

import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

const fetchAuthUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
})

export const login = async (body: { email: string; password: string }) => {
  try {
    const result = await auth.api.signInEmail({ body })
    if (!result?.user) {
      return {
        data: { user: null, session: null },
        error: { code: 'AUTH_ERROR', message: 'Login failed' },
      }
    }
  } catch (e) {
    return {
      data: { user: null, session: null },
      error: { code: 'AUTH_ERROR', message: e instanceof Error ? e.message : 'Login failed' },
    }
  }

  revalidateTag(CacheTag.AuthUser, 'max')
  redirect(APP_ROOT)
}

export const logout = async () => {
  await auth.api.signOut({ headers: await headers() })
  revalidateTag(CacheTag.AuthUserStatus, 'max')
}

export const getAuthUser = fetchAuthUser

export const updateAuthUser = async (attributes: { name?: string; image?: string }) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Not authenticated')

  await auth.api.updateUser({
    body: attributes,
    headers: await headers(),
  })

  revalidateTag(CacheTag.AuthUser, 'max')
  return session.user
}

export const setAuthPassword = async (newPassword: string) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Not authenticated')

  await auth.api.setPassword({
    body: { newPassword },
    headers: await headers(),
  })
}

export const resetPassword = async (email: string, _options?: { redirectTo?: string }) => {
  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: _options?.redirectTo ?? `${process.env.APP_URL}/login`,
      },
    })
    return { data: {}, error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'AUTH_ERROR', message: e instanceof Error ? e.message : 'Failed to send reset email' },
    }
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

export const listUserSessions = async () => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)

  const currentSession = await auth.api.getSession({ headers: await headers() })

  const allSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, authUser.id),
    orderBy: [desc(sessions.createdAt)],
    limit: 50,
  })

  return { sessions: allSessions, currentToken: currentSession?.session.token ?? null }
}

export const revokeUserSession = async (token: string) => {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  if (!currentSession?.user) throw new Error('Not authenticated')
  if (currentSession.session.token === token) return

  await db.delete(sessions).where(and(eq(sessions.token, token), eq(sessions.userId, currentSession.user.id)))
}

export const revokeAllOtherSessions = async () => {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  if (!currentSession?.user) throw new Error('Not authenticated')

  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, currentSession.user.id), ne(sessions.token, currentSession.session.token)))
}
