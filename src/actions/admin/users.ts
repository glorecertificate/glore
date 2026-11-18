'use server'

import 'server-only'

import { adminAction, requireAdmin, requireAdminWithLimit, revalidateUserAccess } from '@/actions/admin/helpers'
import { queryAdminUsers } from '@/actions/admin/users-core'
import { notify } from '@/actions/notifications/notify'
import { transaction } from '@/db/client'
import { adminError, reinstateAccount, setPlatformRole, suspendAccount } from '@/db/mutations/moderation'
import { type AdminUsersQuery, type BanInput, banInputSchema, roleInputSchema } from '@/db/queries/admin-user'

export const listAdminUsers = async (input: AdminUsersQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    return await queryAdminUsers(input)
  })

export const banUser = async (input: BanInput) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('ban', 60)
    const parsed = banInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { expiresAt, reason, userId } = parsed.data

    const { event } = await transaction(tx =>
      suspendAccount(tx, {
        actorId: actor.id,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        reason,
        userId,
      })
    )
    revalidateUserAccess(userId)
    await notify(event)
    return { id: userId }
  })

export const unbanUser = async (userId: string) =>
  await adminAction(async () => {
    if (!userId || typeof userId !== 'string') throw adminError('INVALID_INPUT')
    const actor = await requireAdminWithLimit('ban', 60)

    const { event } = await transaction(tx => reinstateAccount(tx, { actorId: actor.id, userId }))
    revalidateUserAccess(userId)
    await notify(event)
    return { id: userId }
  })

export const updateUserRole = async (userId: string, role: string) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('role', 60)
    const parsed = roleInputSchema.safeParse({ role, userId })
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const result = await transaction(tx =>
      setPlatformRole(tx, { actorId: actor.id, role: parsed.data.role, userId: parsed.data.userId })
    )
    revalidateUserAccess(parsed.data.userId)
    await notify(result.event)
    return { id: parsed.data.userId, role: result.role }
  })
