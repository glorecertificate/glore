import { copycat } from '@snaplet/copycat'
import { createClient } from '@supabase/supabase-js'

import { seeds } from 'config/development.json'
import metadata from 'config/metadata.json'

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

export const seedUsers = async (users = seeds.users) =>
  (
    await Promise.all(
      users.map(async ({ username, ...userMetadata }) => {
        const { data } = await auth.admin.createUser({
          email: `${username}@${metadata.email.split('@').pop()}`,
          password: 'password',
          email_confirm: true,
          phone_confirm: true,
          role: 'authenticated',
          phone: copycat.phoneNumber(username),
          user_metadata: userMetadata,
        })
        return data.user
      }),
    )
  ).filter(Boolean)
