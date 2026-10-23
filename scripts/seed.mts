#!/usr/bin/env node

import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { seedLegal } from './content/legal.mts'
import { LOCAL_DATABASE_REGEX, SEED_ORG_HANDLE, SEED_PASSWORD, SEED_USERS, seedEmail } from './seed-data.ts'
import { setMembership, upsertOrganization, upsertUser } from './seed-db.mts'

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

    const organizationId = await upsertOrganization(
      client,
      {
        handle: SEED_ORG_HANDLE,
        name: 'GloRe Seed Organization',
        email: seedEmail('organization'),
        city: 'Milan',
        country: 'IT',
        approved: true,
      },
      now
    )

    for (const user of SEED_USERS) {
      const userId = await upsertUser(client, {
        user: {
          email: seedEmail(user.key),
          username: `seed.${user.key}`,
          firstName: user.firstName,
          lastName: 'Seed',
          locale: 'en',
          platformRole: user.platformRole,
          isEditor: user.isEditor,
        },
        passwordHash,
        now,
      })
      await setMembership(client, { userId, organizationId, role: user.membership, now })
    }

    await seedLegal(client, { now })
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
