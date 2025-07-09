import { copycat } from '@snaplet/copycat'
import { createClient } from '@supabase/supabase-js'

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

export const seedUsers = async (users = staticSeeds.users) =>
  (
    await Promise.all(
      users.map(async user => {
        const { data } = await auth.admin.createUser({
          email: `${user.first_name.toLowerCase()}@${emailDomain}`,
          password: 'password',
          email_confirm: true,
          phone_confirm: true,
          role: 'authenticated',
          phone: copycat.phoneNumber(user.first_name),
          user_metadata: user,
        })
        return data.user
      }),
    )
  ).filter(Boolean)
