'use server'

import 'server-only'

import { headers } from 'next/headers'

import { adminAction, requireAdminWithLimit } from '@/actions/admin/helpers'
import { adminError } from '@/db/mutations/moderation'
import { type ImpersonationInput, impersonationInputSchema } from '@/db/queries/admin-user'
import { auth } from '@/lib/auth'

export const startImpersonation = async (input: ImpersonationInput) =>
  await adminAction(async () => {
    await requireAdminWithLimit('impersonate', 20)
    const parsed = impersonationInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    return await auth.api.startImpersonation({ body: parsed.data, headers: await headers() })
  })

export const stopImpersonation = async () =>
  await adminAction(async () => await auth.api.stopImpersonation({ headers: await headers() }))
