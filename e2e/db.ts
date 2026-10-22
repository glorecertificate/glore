import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

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
