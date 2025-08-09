import { type User } from '@supabase/supabase-js'

import { client } from 'supabase/seeds/config'
import { organization as seeder } from 'supabase/seeds/data'
import { emailToRole, verifyResponse } from 'supabase/seeds/utils'
import { type Enums, type Tables } from 'supabase/types'

export const seedMemberships = async (organization: Tables<'organizations'>, users: User[]) => {
  const response = await client
    .from('memberships')
    .insert(
      seeder.memberships.map(role => {
        const user = users.find(user => emailToRole(user.email) === role)!

        return {
          role: role as Enums<'role'>,
          organization_id: organization.id,
          user_id: user.id,
          deleted_at: null,
        }
      }),
    )
    .select()

  verifyResponse(response, 'memberships')
  return response.data!
}
