import { type AuthUser, type Enums, type Tables } from '@/lib/db'
import { seedClient, seeder, verifyResponse } from './shared'

const emailToRole = (email?: string) => email?.split('@')[0]

export const seedMemberships = async (organization: Tables<'organizations'>, users: AuthUser[]) => {
  const response = await seedClient
    .from('memberships')
    .insert(
      seeder.organization.memberships.map(role => {
        const user = users.find(user => emailToRole(user.email) === role)!

        return {
          deleted_at: null,
          organization_id: organization.id,
          role: role as Enums<'role'>,
          user_id: user.id,
        }
      })
    )
    .select()
  verifyResponse(response, 'memberships')

  return response.data!
}
