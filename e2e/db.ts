import { randomUUID } from 'node:crypto'

import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX, SEED_ORG_HANDLE, SEED_PASSWORD } from '~/scripts/seed-data'

export const clearRateLimits = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query('delete from rate_limits')
  await pool.end()
}

export const deleteCourseBySlug = async (slug: string) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query('delete from lessons where course_id in (select id from courses where slug = $1)', [slug])
  await pool.query('delete from courses where slug = $1', [slug])
  await pool.end()
}

interface SeededCertificate {
  code: string
  handle: string
}

const LOCAL_CONNECTION = () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) {
    throw new Error('E2E certificate seeding only runs against the local database')
  }
  return connectionString
}

export const seedPublicCertificate = async ({
  code,
  email,
  status,
}: {
  code: string
  email: string
  status: 'approved' | 'revoked'
}): Promise<SeededCertificate> => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  const handle = `e2e-${code.toLowerCase()}`
  try {
    const user = await pool.query<{ id: string }>('select id from users where email = $1', [email])
    const userId = user.rows[0]?.id
    if (!userId) throw new Error(`Missing seeded user ${email}`)
    const membership = await pool.query<{ organization_id: number }>(
      'select organization_id from memberships where user_id = $1 limit 1',
      [userId]
    )
    const organizationId = membership.rows[0]?.organization_id
    if (!organizationId) throw new Error(`Missing membership for ${email}`)
    const courses = await pool.query<{ id: number }>("select id from courses where type = 'skill' order by id limit 3")

    await pool.query('delete from certificates where code = $1', [code])
    const inserted = await pool.query<{ id: number }>(
      `insert into certificates
        (handle, code, user_id, organization_id, language, activity_start_date, activity_end_date, activity_duration,
         activity_location, activity_description, tasks, status, issued_at, revoked_at, revoked_reason, is_default)
       values ($1, $2, $3, $4, 'en', '2026-01-10', '2026-06-30', 120, 'Milan', 'E2E experience',
         array['Welcomed new volunteers'], $5, now(), $6, $7,
         $8 and not exists (select 1 from certificates where user_id = $3 and is_default))
       returning id`,
      [
        handle,
        code,
        userId,
        organizationId,
        status,
        status === 'revoked' ? new Date().toISOString() : null,
        status === 'revoked' ? 'E2E revoked' : null,
        status === 'approved',
      ]
    )
    const certificateId = inserted.rows[0]?.id
    for (const [index, course] of courses.rows.entries()) {
      await pool.query(
        'insert into certificate_skills (certificate_id, course_id, level, self_level, sort_order, statement) values ($1, $2, 4, 4, $3, $4)',
        [certificateId, course.id, index, 'E2E statement']
      )
    }
  } finally {
    await pool.end()
  }
  return { code, handle }
}

export const removePublicCertificates = async (codes: string[]) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  try {
    await pool.query('delete from certificates where code = any($1)', [codes])
  } finally {
    await pool.end()
  }
}

export const setPublicProfile = async ({
  email,
  publicProfile,
  username,
}: {
  email: string
  publicProfile: boolean
  username: string | null
}) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  try {
    await pool.query('update users set public_profile = $2, username = $3 where email = $1', [
      email,
      publicProfile,
      username,
    ])
  } finally {
    await pool.end()
  }
}

export const pruneSessions = async (email: string, keep: number) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  try {
    await pool.query(
      `delete from sessions
       where user_id = (select id from users where email = $1)
         and id not in (
           select id from sessions
           where user_id = (select id from users where email = $1)
           order by created_at desc
           limit $2
         )`,
      [email, keep]
    )
  } finally {
    await pool.end()
  }
}

export const createSeedInvitation = async (email: string, role: string) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) throw new Error('Local database required')
  const pool = new Pool({ connectionString })
  const token = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  await pool.query('delete from organization_invitations where lower(email) = lower($1)', [email])
  await pool.query(
    `insert into organization_invitations (organization_id, email, role, token, expires_at, last_sent_at)
     select id, $1, $2::role, $3, now() + interval '7 days', now() from organizations where handle = $4`,
    [email, role, token, SEED_ORG_HANDLE]
  )
  await pool.end()
  return token
}

export const deleteUserByEmail = async (email: string) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query('delete from organization_invitations where lower(email) = lower($1)', [email])
  await pool.query('delete from users where lower(email) = lower($1)', [email])
  await pool.end()
}

export const createLoginUser = async ({ email, firstName }: { email: string; firstName: string }) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  const id = randomUUID()
  try {
    await pool.query(
      `insert into users (id, name, email, email_verified, first_name, last_name, onboarded_at, role)
       values ($1, $2, $3, true, $2, 'E2E', now(), 'user')`,
      [id, firstName, email]
    )
    await pool.query(
      `insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
       values ($1, $1, 'credential', $2, $3, now(), now())`,
      [randomUUID(), id, await hashPassword(SEED_PASSWORD)]
    )
  } finally {
    await pool.end()
  }
  return { email, id }
}

export const removeLoginUsers = async (ids: string[]) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  try {
    await pool.query('delete from activity_events where actor_id = any($1) or subject_id = any($1)', [ids])
    await pool.query('delete from users where id = any($1)', [ids])
  } finally {
    await pool.end()
  }
}

export const listSubjectEvents = async (action: string, subjectId: string) => {
  const pool = new Pool({ connectionString: LOCAL_CONNECTION() })
  try {
    const result = await pool.query<{ actor_id: string; metadata: Record<string, unknown> }>(
      'select actor_id, metadata from activity_events where action = $1 and subject_id = $2 order by id',
      [action, subjectId]
    )
    return result.rows
  } finally {
    await pool.end()
  }
}
