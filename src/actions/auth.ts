'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect, unstable_rethrow } from 'next/navigation'
import { cache } from 'react'

import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { APP_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

export const getAuthUser = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user ?? null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
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

// const updateAuthUser = async (attributes: { name?: string; image?: string }) => {
//   const session = await auth.api.getSession({ headers: await headers() })
//   if (!session?.user) throw new Error('Not authenticated')

//   await auth.api.updateUser({
//     body: attributes,
//     headers: await headers(),
//   })

//   revalidateTag(CacheTag.AuthUser, 'max')
//   return session.user
// }

export const setAuthPassword = async (newPassword: string) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Not authenticated')

  const ctx = await auth.$context
  const passwordHash = await ctx.password.hash(newPassword)
  const credential = (await ctx.internalAdapter.findAccounts(session.user.id)).find(
    account => account.providerId === 'credential' && account.password
  )

  if (credential) {
    await ctx.internalAdapter.updatePassword(session.user.id, passwordHash)
    return
  }

  await ctx.internalAdapter.linkAccount({
    accountId: session.user.id,
    providerId: 'credential',
    password: passwordHash,
    userId: session.user.id,
  })
}

export const refreshAuthSession = async () => {
  await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
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
