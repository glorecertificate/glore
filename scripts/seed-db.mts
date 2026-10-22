import { randomUUID } from 'node:crypto'

import { type PoolClient } from 'pg'

import { type MembershipRole } from './seed-data.ts'

interface UserRow {
  email: string
  username: string
  firstName: string
  lastName: string
  locale: string
  platformRole?: 'admin'
  isEditor?: boolean
}

export interface OrganizationRow {
  handle: string
  name: string
  email: string
  city: string
  country: string
  approved: boolean
}

interface UpsertUserOptions {
  user: UserRow
  passwordHash: string
  now: string
}

interface MembershipOptions {
  userId: string
  organizationId: number
  role: MembershipRole | undefined
  now: string
}

export const upsertUser = async (client: PoolClient, { user, passwordHash, now }: UpsertUserOptions) => {
  const { rows } = await client.query<{ id: string }>(
    `insert into users (id, name, email, email_verified, username, display_username, first_name, last_name, locale, role, is_editor, onboarded_at, created_at, updated_at)
     values ($1, $2, $3, true, $4, $4, $5, $6, $7, $8, $9, $10, $10, $10)
     on conflict (email) do update set
       name = excluded.name, email_verified = true, username = excluded.username, display_username = excluded.display_username,
       first_name = excluded.first_name, last_name = excluded.last_name, locale = excluded.locale, role = excluded.role,
       is_editor = excluded.is_editor, banned = false,
       onboarded_at = coalesce(users.onboarded_at, excluded.onboarded_at), updated_at = excluded.updated_at
     returning id`,
    [
      randomUUID(),
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.username,
      user.firstName,
      user.lastName,
      user.locale,
      user.platformRole ?? 'user',
      user.isEditor ?? false,
      now,
    ]
  )
  const [{ id }] = rows

  await client.query(`delete from accounts where user_id = $1 and provider_id = 'credential'`, [id])
  await client.query(
    `insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values ($1, $2, 'credential', $2, $3, $4, $4)`,
    [randomUUID(), id, passwordHash, now]
  )

  return id
}

export const upsertOrganization = async (client: PoolClient, organization: OrganizationRow, now: string) => {
  const { rows } = await client.query<{ id: number }>(
    `insert into organizations (handle, name, email, city, approved_at, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $6)
     on conflict (handle) do update set approved_at = coalesce(organizations.approved_at, excluded.approved_at)
     returning id`,
    [
      organization.handle,
      organization.name,
      organization.email,
      organization.city,
      organization.approved ? now : null,
      now,
    ]
  )
  const [{ id }] = rows

  await client.query(
    `insert into organization_profiles (organization_id, country, created_at, updated_at)
     values ($1, $2, $3, $3)
     on conflict (organization_id) do nothing`,
    [id, organization.country, now]
  )

  return id
}

export const setMembership = async (client: PoolClient, { userId, organizationId, role, now }: MembershipOptions) => {
  await client.query('delete from memberships where user_id = $1 and organization_id = $2', [userId, organizationId])
  if (!role) return
  await client.query(
    'insert into memberships (user_id, organization_id, role, created_at, updated_at) values ($1, $2, $3, $4, $4)',
    [userId, organizationId, role, now]
  )
}
