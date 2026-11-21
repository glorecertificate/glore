import { Pool } from 'pg'

import { LOCALES } from '~/scripts/content/config.mts'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

export const clearRateLimits = async (connectionString = process.env.DATABASE_URL) => {
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query('delete from rate_limits')
  await pool.end()
}

export const deleteCourseBySlug = async (slug: string) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query(
    `delete from content_translations where (entity_type = 'course' and entity_id in (select id from courses where slug = $1))
       or (entity_type = 'lesson' and entity_id in (select l.id from lessons l join courses c on c.id = l.course_id where c.slug = $1))`,
    [slug]
  )
  await pool.query('delete from lessons where course_id in (select id from courses where slug = $1)', [slug])
  await pool.query('delete from courses where slug = $1', [slug])
  await pool.end()
}

export const E2E_DESCRIPTION = 'E2E description'

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
    const courses = await pool.query<{ id: number; title: Record<string, string> | null }>(
      "select id, title from courses where type = 'skill' order by id limit 3"
    )

    await pool.query('delete from certificates where code = $1', [code])
    const inserted = await pool.query<{ id: number }>(
      `insert into certificates
        (handle, code, user_id, organization_id, language, activity_start_date, activity_end_date, activity_duration,
         activity_location, activity_description, tasks, status, issued_at, revoked_at, revoked_reason, is_default,
         snapshot)
       values ($1, $2, $3, $4, 'en', '2026-01-10', '2026-06-30', 120, 'Milan', 'E2E experience',
         array['Welcomed new volunteers'], $5, now(), $6, $7,
         $8 and not exists (select 1 from certificates where user_id = $3 and is_default), $9)
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
        JSON.stringify({
          activity: {
            duration: 120,
            endDate: '2026-06-30',
            location: 'Milan',
            startDate: '2026-01-10',
            tasks: ['Welcomed new volunteers'],
          },
          holder: { birthPlace: null, birthday: null, firstName: 'E2E', lastName: 'Holder', nationality: null },
          issuedAt: new Date().toISOString(),
          language: 'en',
          organization: {
            id: organizationId,
            legalRepresentative: null,
            logoUrl: null,
            name: 'E2E',
            signatureUrl: null,
          },
          skills: courses.rows.map(course => ({
            courseId: course.id,
            description: Object.fromEntries(LOCALES.map(locale => [locale, E2E_DESCRIPTION])),
            icon: null,
            level: 'good',
            name: course.title ?? { en: 'E2E skill' },
          })),
        }),
      ]
    )
    const certificateId = inserted.rows[0]?.id
    for (const [index, course] of courses.rows.entries()) {
      await pool.query(
        "insert into certificate_skills (certificate_id, course_id, level, self_level, sort_order) values ($1, $2, 'good', 'good', $3)",
        [certificateId, course.id, index]
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
