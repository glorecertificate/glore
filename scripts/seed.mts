#!/usr/bin/env node

import { randomUUID } from 'node:crypto'

import { hashPassword } from 'better-auth/crypto'
import { Pool, type PoolClient } from 'pg'

import {
  LOCAL_DATABASE_REGEX,
  SEED_ORG_HANDLE,
  SEED_PASSWORD,
  SEED_USERS,
  type SeedUser,
  seedEmail,
} from './seed-data.ts'

interface UpsertUserOptions {
  user: SeedUser
  passwordHash: string
  now: string
}

const upsertUser = async (client: PoolClient, { user, passwordHash, now }: UpsertUserOptions) => {
  const email = seedEmail(user.key)
  const { rows } = await client.query<{ id: string }>(
    `insert into users (id, name, email, email_verified, username, display_username, first_name, last_name, locale, role, is_editor, onboarded_at, created_at, updated_at)
     values ($1, $2, $3, true, $4, $4, $5, 'Seed', 'en', $6, $7, $8, $8, $8)
     on conflict (email) do update set
       name = excluded.name, email_verified = true, username = excluded.username, display_username = excluded.display_username,
       first_name = excluded.first_name, role = excluded.role, is_editor = excluded.is_editor, banned = false,
       onboarded_at = coalesce(users.onboarded_at, excluded.onboarded_at), updated_at = excluded.updated_at
     returning id`,
    [
      randomUUID(),
      `${user.firstName} Seed`,
      email,
      `seed.${user.key}`,
      user.firstName,
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

const upsertOrganization = async (client: PoolClient, now: string) => {
  const { rows } = await client.query<{ id: number }>(
    `insert into organizations (handle, name, email, city, approved_at, created_at, updated_at)
     values ($1, 'GloRe Seed Organization', $2, 'Milan', $3, $3, $3)
     on conflict (handle) do update set approved_at = coalesce(organizations.approved_at, excluded.approved_at)
     returning id`,
    [SEED_ORG_HANDLE, seedEmail('organization'), now]
  )
  const [{ id }] = rows

  await client.query(
    `insert into organization_profiles (organization_id, country, created_at, updated_at)
     values ($1, 'IT', $2, $2)
     on conflict (organization_id) do nothing`,
    [id, now]
  )

  return id
}

const seed = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) {
    console.error('Refusing to seed: DATABASE_URL must point to localhost or 127.0.0.1.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  const now = new Date().toISOString()

  try {
    const passwordHash = await hashPassword(SEED_PASSWORD)
    await client.query('begin')

    const organizationId = await upsertOrganization(client, now)

    for (const user of SEED_USERS) {
      const userId = await upsertUser(client, { user, passwordHash, now })
      await client.query('delete from memberships where user_id = $1 and organization_id = $2', [
        userId,
        organizationId,
      ])
      if (!user.membership) continue
      await client.query(
        'insert into memberships (user_id, organization_id, role, created_at, updated_at) values ($1, $2, $3, $4, $4)',
        [userId, organizationId, user.membership, now]
      )
    }

    await client.query('delete from rate_limits')
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
    await pool.end()
  }

  for (const { key, platformRole, isEditor, membership } of SEED_USERS) {
    console.info(`${seedEmail(key)}  ${platformRole ?? (isEditor ? 'editor' : `org ${membership}`)}`)
  }
  console.info(`Password for every seeded user: ${SEED_PASSWORD}`)
}

if (import.meta.main) await seed()
