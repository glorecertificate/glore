import { log } from '@repo/utils'

import { seedMemberships } from 'supabase/seeds/models/membership'
import { seedOrganizations } from 'supabase/seeds/models/organization'
import { seedSkills } from 'supabase/seeds/models/skill'
import { seedUsers } from 'supabase/seeds/models/user'
import { createIncludes, logEntities, resetDatabase } from 'supabase/seeds/utils'

const args = process.argv.slice(2)
const reset = !args.includes('--skip-reset')

const includes = createIncludes(args)

void (async () => {
  try {
    if (reset) {
      await resetDatabase()
      log.success('Database reset')
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

    if (includes('skill')) {
      const skills = await seedSkills({ users })
      logEntities({ skills })
    }

    process.exit(0)
  } catch (error) {
    log.error('An error occurred')
    throw error as Error
  }
})()
