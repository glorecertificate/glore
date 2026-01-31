'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag, revalidateTag } from 'next/cache'

import { type Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { sendEmail } from '@/actions/email'
import { getCurrentUser } from '@/actions/user'
import { getDatabase, getServiceDatabase } from '@/db/client'
import { resolveQuery } from '@/db/helpers'
import { parseUser, userQuery } from '@/db/queries/user'
import { type DatabaseQuery } from '@/db/types'
import { CacheTag } from '@/lib/cache'
import { JOIN_ROOT } from '@/lib/constants'

const INVITATION_EXPIRY_DAYS = 7

const fetchTeamMembers = async (query: DatabaseQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)

  return await resolveQuery(query, parseUser)
}

export const getTeamMembers = async () => {
  const db = await getDatabase()
  const query = db.from('users').select(userQuery).or('is_admin.eq.true,is_editor.eq.true')
  return await fetchTeamMembers(query)
}

export const inviteTeamMember = async ({
  email,
  firstName,
  lastName,
  locale,
  role,
}: {
  email: string
  firstName: string
  lastName: string
  locale: Locale
  role: 'admin' | 'editor'
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.is_admin) return { error: 'Only admins can invite team members' }

  const db = await getServiceDatabase()

  const { data: authData, error: authError } = await db.auth.admin.createUser({ email, email_confirm: false })
  if (authError) return { error: authError }

  const { error: updateError } = await db
    .from('users')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      is_admin: role === 'admin',
      is_editor: role === 'editor',
      locale,
    })
    .eq('id', authData.user.id)
  if (updateError) return { error: updateError.message }

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: inviteError } = await db.from('team_invitations').insert({
    user_id: authData.user.id,
    token,
    email,
    first_name: firstName.trim(),
    last_name: lastName.trim() || null,
    role,
    locale,
    invited_by: currentUser.id,
    expires_at: expiresAt,
  })
  if (inviteError) return { error: inviteError.message }

  const t = await getTranslations('Admin.team')
  const inviteeName = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || t('teamAdmin')
  const displayName = [firstName, lastName].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}${JOIN_ROOT}?token=${token}`

  try {
    await sendEmail('team/invite', {
      to: email,
      locale,
      username: displayName,
      inviteeName,
      role,
      joinUrl,
    })
  } catch (error) {
    console.error('Failed to send team invite email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to send invitation email' }
  }

  revalidateTag(CacheTag.TeamMembers, 'max')
  return { data: { id: authData.user.id, email, role } }
}

export const resendInvitation = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.is_admin) return { error: 'Only admins can resend invitations' }

  const db = await getServiceDatabase()

  const { data: existing, error: fetchError } = await db
    .from('team_invitations')
    .select('id, email, first_name, last_name, role, locale')
    .eq('user_id', userId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (fetchError || !existing) return { error: 'No pending invitation found for this user' }

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: updateError } = await db
    .from('team_invitations')
    .update({ token, expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
  if (updateError) return { error: updateError.message }

  const t = await getTranslations('Admin.team')
  const inviteeName = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || t('teamAdmin')
  const displayName = [existing.first_name, existing.last_name].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}/api/v1/join?token=${token}`
  const locale = (existing.locale ?? 'en') as Locale

  try {
    await sendEmail('team/invite', {
      to: existing.email,
      locale,
      username: displayName,
      inviteeName,
      role: existing.role as 'admin' | 'editor',
      joinUrl,
    })
  } catch (error) {
    console.error('Failed to resend team invite email:', error)
    return { error: error instanceof Error ? error : 'Failed to resend invitation email' }
  }

  return { data: { email: existing.email } }
}

export const updateTeamMemberRole = async (userId: string, role: 'admin' | 'editor') => {
  const currentUser = await getCurrentUser()
  if (!currentUser.is_admin) return { error: 'Only admins can update team member roles' }
  if (currentUser.id === userId) return { error: 'You cannot change your own role' }

  const db = await getServiceDatabase()

  const { error } = await db
    .from('users')
    .update({
      is_admin: role === 'admin',
      is_editor: role === 'editor',
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidateTag(CacheTag.TeamMembers, 'max')
  return { data: { id: userId, role } }
}

export const deleteTeamMember = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.is_admin) return { error: 'You must be an admin to remove team members' }
  if (currentUser.id === userId) return { error: 'You cannot remove yourself from the team' }

  const db = await getServiceDatabase()

  const { error } = await db.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidateTag(CacheTag.TeamMembers, 'max')
  return { data: { id: userId } }
}
