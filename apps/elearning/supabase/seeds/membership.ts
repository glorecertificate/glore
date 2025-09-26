import { type AuthUser } from '@/lib/api'
import { type Enums, type Tables } from 'supabase/types'

import { client } from './shared/client'
import { organization as seeder } from './shared/data'
import { emailToRole, verifyResponse } from './shared/utils'

export const seedMemberships = async (organization: Tables<'organizations'>, users: AuthUser[]) => {
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
