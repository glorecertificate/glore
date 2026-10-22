#!/usr/bin/env node

import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { SEED_PASSWORD } from './seed-data.ts'
import { upsertUser } from './seed-db.mts'
import {
  DEMO_USAGE,
  DEMO_USERS,
  STAGING_COMMENT,
  demoEmail,
  demoUsername,
  guardDemoTarget,
  parseDemoArgs,
} from './seed-demo-data.ts'
import {
  type DemoIds,
  insertDemoCertificates,
  insertDemoEvents,
  insertDemoFlows,
  insertDemoProgress,
  loadCatalog,
  syncDemoMemberships,
  updateDemoProfiles,
  upsertDemoOrganizations,
  upsertEditorCourses,
  wipeDemoScope,
} from './seed-demo-db.mts'
import { SKILL_COMPASS, planDemo } from './seed-demo-story.ts'

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
  const now = new Date()
  const plan = planDemo(now)

  try {
    const { rows } = await client.query<{ value: string | null }>(
      "select shobj_description(oid, 'pg_database') as value from pg_database where datname = current_database()"
    )
    if (args.target === 'staging' && rows[0]?.value !== STAGING_COMMENT) {
      return fail(`Refusing to seed: the database comment is not '${STAGING_COMMENT}'.`)
    }

    const passwordHash = await hashPassword(SEED_PASSWORD)
    const iso = now.toISOString()
    await client.query('begin')
    const context = { client, now, testEmail }

    const slugs = [
      ...new Set([
        ...plan.progress.map(({ course }) => course),
        ...plan.certificates.flatMap(({ skills }) => skills.map(({ course }) => course)),
        ...Object.values(SKILL_COMPASS).flatMap(({ goals, strengths }) => [...goals, ...strengths]),
      ]),
    ]
    const catalog = await loadCatalog(context, slugs)
    await client.query('delete from rate_limits')
    const organizations = await upsertDemoOrganizations(context)
    const users = new Map<string, string>()
    for (const user of DEMO_USERS) {
      const id = await upsertUser(client, {
        user: { ...user, email: demoEmail(testEmail, user.key), username: demoUsername(user.key) },
        passwordHash,
        now: iso,
      })
      users.set(user.key, id)
    }
    const ids: DemoIds = { organizations, users }

    await updateDemoProfiles(context, ids)
    await syncDemoMemberships(context, ids)
    await wipeDemoScope(context, ids)
    await upsertEditorCourses(context, ids)

    const flows = await insertDemoFlows(context, ids)
    const certificates = await insertDemoCertificates(context, ids, { catalog, certificates: plan.certificates })
    await insertDemoProgress(context, ids, { catalog, progress: plan.progress })
    await insertDemoEvents(context, ids, {
      events: plan.events,
      notifications: plan.notifications,
      refs: { certificates, courses: catalog, flows },
    })

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
  console.info('Certificate codes:')
  for (const { code, holder, key, status } of plan.certificates) {
    if (code) console.info(`${code}  ${status}  ${holder ?? 'deleted holder'}  (${key})`)
  }
  console.info(
    `Seeded ${plan.certificates.length} certificates, ${plan.events.length} events, ${plan.notifications.length} notifications.`
  )
}

if (import.meta.main) await seedDemo()
