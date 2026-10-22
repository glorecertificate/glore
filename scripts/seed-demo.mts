#!/usr/bin/env node

import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { SEED_PASSWORD } from './seed-data.ts'
import { setMembership, upsertOrganization, upsertUser } from './seed-db.mts'
import {
  DEMO_ORGANIZATIONS,
  DEMO_USAGE,
  DEMO_USERS,
  STAGING_MARKER,
  STAGING_SETTING,
  demoEmail,
  demoUsername,
  guardDemoTarget,
  parseDemoArgs,
} from './seed-demo-data.ts'

const fail = (message: string) => {
  console.error(message)
  process.exit(1)
}

const seedDemo = async () => {
  const args = parseDemoArgs(process.argv.slice(2))
  if (!args.target) return fail(`${args.error}\n${DEMO_USAGE}`)

  const { DATABASE_URL: connectionString, TEST_EMAIL: testEmail } = process.env
  const error = guardDemoTarget(args.target, connectionString, testEmail)
  if (error || !testEmail) return fail(error ?? DEMO_USAGE)

  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  const now = new Date().toISOString()

  try {
    const { rows } = await client.query<{ value: string | null }>('select current_setting($1, true) as value', [
      STAGING_SETTING,
    ])
    if (args.target === 'staging' && rows[0]?.value !== STAGING_MARKER) {
      return fail(`Refusing to seed: the database lacks ${STAGING_SETTING} = '${STAGING_MARKER}'.`)
    }

    const passwordHash = await hashPassword(SEED_PASSWORD)
    await client.query('begin')

    const organizationIds = new Map<string, number>()
    for (const organization of DEMO_ORGANIZATIONS) {
      const id = await upsertOrganization(
        client,
        { ...organization, email: demoEmail(testEmail, `org-${organization.key}`) },
        now
      )
      organizationIds.set(organization.key, id)
    }

    for (const user of DEMO_USERS) {
      const userId = await upsertUser(client, {
        user: { ...user, email: demoEmail(testEmail, user.key), username: demoUsername(user.key) },
        passwordHash,
        now,
      })
      for (const [key, organizationId] of organizationIds) {
        await setMembership(client, { userId, organizationId, role: user.memberships[key], now })
      }
    }

    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
    await pool.end()
  }

  for (const { key, platformRole, isEditor, memberships } of DEMO_USERS) {
    const roles = Object.entries(memberships).map(([organization, role]) => `${role} in ${organization}`)
    console.info(`${demoEmail(testEmail, key)}  ${platformRole ?? (isEditor ? 'editor' : roles.join(', '))}`)
  }
  console.info(`Password for every demo account: ${SEED_PASSWORD}`)
}

if (import.meta.main) await seedDemo()
