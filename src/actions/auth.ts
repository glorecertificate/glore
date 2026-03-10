'use server'

import 'server-only'

import { cacheTag, revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/server'
import { CacheTag } from '@/lib/cache'
import { APP_ROOT } from '@/lib/constants'

const fetchAuthUser = async () => {
  'use cache'
  cacheTag(CacheTag.AuthUser)

  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email: credentials.email,
        password: credentials.password,
      },
    })
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

export const getAuthUser = async () => await fetchAuthUser()

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
    await auth.api.resetPassword({
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

  return { data: session.user }
}
