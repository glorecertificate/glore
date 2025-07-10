import { copycat } from '@snaplet/copycat'
import { createClient } from '@supabase/supabase-js'

import { log } from '@repo/utils'

import { emailDomain, staticSeeds } from 'supabase/.snaplet/data.json'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SERVICE_ROLE_KEY must be set')
}

const { auth } = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const seedUsers = async (roles = staticSeeds.users) =>
  (
    await Promise.all(
      roles.map(async role => {
        const { data, error } = await auth.admin.createUser({
          email: `${role}@${emailDomain}`,
          password: 'password',
          email_confirm: true,
          phone_confirm: true,
          role: 'authenticated',
          phone: copycat.phoneNumber(role),
          user_metadata: {
            first_name: copycat.firstName(role),
            last_name: copycat.lastName(role),
            is_admin: role === 'admin',
            is_editor: role === 'editor',
          },
        })
        if (error) {
          log.error('Error creating users')
          throw error
        }
        return data.user
      }),
    )
  ).filter(Boolean)
