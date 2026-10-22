import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX, seedEmail } from '~/scripts/seed-data'

const withPool = async <T>(run: (pool: Pool) => Promise<T>) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return null
  const pool = new Pool({ connectionString })
  try {
    return await run(pool)
  } finally {
    await pool.end()
  }
}

export const resetNotifications = async (key: string, types: string[]) =>
  await withPool(async pool => {
    await pool.query('delete from notifications where user_id = (select id from users where email = $1)', [
      seedEmail(key),
    ])
    for (const type of types) {
      await pool.query(
        "insert into notifications (user_id, type, url) select id, $2, '/courses' from users where email = $1",
        [seedEmail(key), type]
      )
    }
  })

export const clearNotifications = async (key: string) =>
  await withPool(async pool => {
    await pool.query('delete from notifications where user_id = (select id from users where email = $1)', [
      seedEmail(key),
    ])
  })
