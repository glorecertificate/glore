import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

export const clearRateLimits = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return
  const pool = new Pool({ connectionString })
  await pool.query('delete from rate_limits')
  await pool.end()
}
