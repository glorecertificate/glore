import { type MembershipRole } from '~/scripts/seed-data'

import { type Tenant, withDb } from './tenant'

const DAY_MS = 86_400_000

export const seedInvitation = async ({
  email,
  role,
  state,
  tenant,
}: {
  email: string
  role: MembershipRole
  state: 'expired' | 'pending' | 'revoked'
  tenant: Tenant
}) =>
  await withDb(async pool => {
    const token = `g2${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
    const expiresAt = new Date(Date.now() + (state === 'expired' ? -DAY_MS : 7 * DAY_MS)).toISOString()
    await pool.query(
      `insert into organization_invitations
        (organization_id, email, role, token, expires_at, revoked_at, last_sent_at)
       values ($1, $2, $3::role, $4, $5, $6, now())`,
      [tenant.id, email, role, token, expiresAt, state === 'revoked' ? new Date().toISOString() : null]
    )
    return token
  })

export const membershipRoleOf = async (tenant: Tenant, userId: string) =>
  await withDb(async pool => {
    const result = await pool.query<{ role: string }>(
      'select role from memberships where organization_id = $1 and user_id = $2',
      [tenant.id, userId]
    )
    return result.rows[0]?.role ?? null
  })

export const organizationExists = async (id: number) =>
  await withDb(async pool => {
    const result = await pool.query('select 1 from organizations where id = $1', [id])
    return result.rowCount === 1
  })

export const addMembership = async (tenant: Tenant, userId: string, role: MembershipRole) =>
  await withDb(async pool => {
    await pool.query('insert into memberships (user_id, organization_id, role) values ($1, $2, $3::role)', [
      userId,
      tenant.id,
      role,
    ])
  })

export const invitationRow = async (tenant: Tenant, email: string) =>
  await withDb(async pool => {
    const result = await pool.query<{
      accepted_at: string | null
      declined_at: string | null
      revoked_at: string | null
    }>(
      'select accepted_at, declined_at, revoked_at from organization_invitations where organization_id = $1 and lower(email) = lower($2) order by id desc limit 1',
      [tenant.id, email]
    )
    return result.rows[0] ?? null
  })

export const invitationToken = async (tenant: Tenant, email: string) =>
  await withDb(async pool => {
    const result = await pool.query<{ token: string }>(
      'select token from organization_invitations where organization_id = $1 and lower(email) = lower($2) order by id desc limit 1',
      [tenant.id, email]
    )
    return result.rows[0]?.token ?? ''
  })

export const certificateStatuses = async (tenant: Tenant) =>
  await withDb(async pool => {
    const result = await pool.query<{ status: string }>('select status from certificates where organization_id = $1', [
      tenant.id,
    ])
    return result.rows.map(row => row.status)
  })
