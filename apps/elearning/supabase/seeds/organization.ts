import { type SeedClient } from '@snaplet/seed'
import { type User } from '@supabase/supabase-js'

import { staticSeeds } from 'supabase/.snaplet/data.json'
import { type Enums } from 'supabase/types'

export const seedOrganizations = async (seed: SeedClient, users: Array<User | null>) =>
  await seed.regions(
    staticSeeds.regions.map(({ organizations, ...region }) => ({
      ...region,
      organization_regions: [
        {
          organizations: {
            ...organizations[0],
            rating: Math.random() * 5,
            approved_at: new Date().toISOString(),
            memberships: organizations[0].memberships.map(membershipRole => {
              const user = users.find(user => user?.email?.split('@')[0] === membershipRole)

              return {
                role: membershipRole as Enums<'organization_role'>,
                user_id: user?.id,
                deleted_at: null,
              }
            }),
            deleted_at: null,
          },
          deleted_at: null,
        },
      ],
      deleted_at: null,
    })),
  )
