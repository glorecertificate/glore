import '@glore/env'

import { Client } from 'pg'

import { type PublicTable } from '@/lib/db'
import { seedCourses } from './seeds/course'
import { seedMemberships } from './seeds/membership'
import { seedOrganizations } from './seeds/organization'
import { seedUsers } from './seeds/user'

const args = process.argv.slice(2)
const reset = !args.includes('--skip-reset')

const includes = (arg: string) =>
  args.filter(arg => !arg.startsWith('--')).length === 0 || args.includes(arg) || args.includes(`${arg}s`)

const logError = (...data: string[]) => console.error('\x1b[31m✖︎\x1b[0m', ...data)
const logSuccess = (...data: string[]) => console.info('\x1b[32m✔︎\x1b[0m', ...data)

const logEntities = <T>(entities: Partial<Record<PublicTable, T[]>>) => {
  const entity = Object.keys(entities)[0] as PublicTable
  const list = entities[entity]!
  if (list.length === 0) return logError(`No ${String(entity)} created`)
  logSuccess(`Created ${list.length} ${String(entity)}`)
}

export const resetDatabase = async () => {
  const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL })
  await pg.connect()

  const publicTables = (
    await pg.query<{
      table_name: string
    }>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  ).rows.map(table => `public.${table.table_name}`)

  await pg.query('TRUNCATE auth.users CASCADE')
  await pg.query(`TRUNCATE ${publicTables.join(', ')} RESTART IDENTITY CASCADE`)
}

void (async () => {
  try {
    if (reset) {
      await resetDatabase()
      logSuccess('Database reset')
    }

    const users = await seedUsers()
    logEntities({ users })

    if (includes('org') || includes('organization')) {
      const organizations = await seedOrganizations()
      logEntities({ organizations })

      if (includes('membership')) {
        const memberships = await seedMemberships(organizations[0], users)
        logEntities({ memberships })
      }
    }

    if (includes('courses')) {
      const courses = await seedCourses({ users })
      logEntities({ courses })
    }

    process.exit(0)
  } catch (error) {
    logError('An error occurred')
    throw error as Error
  }
})()
