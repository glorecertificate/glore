import { copycat } from '@snaplet/copycat'
import { createClient, type User } from '@supabase/supabase-js'

import { log, pickRandom, randomRange, uuid } from '@repo/utils'

import { emailDomain, placeholderAvatarUrl, staticSeeds } from 'supabase/.snaplet/data.json'
import { type Database } from 'supabase/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SERVICE_ROLE_KEY must be set')
}

const client = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const LANGUAGES = ['en', 'it', 'fr', 'es', 'de', 'pt', 'zh', 'ja', 'ru', 'ar']
const PHONE_PREFIXES = ['+1', '+33', '+39', '+44', '+49']

export const seedUsers = async (roles = staticSeeds.users) =>
  (
    await Promise.all(
      roles.map(async role => {
        const { data: authData, error: authError } = await client.auth.admin.createUser({
          email: `${role}@${emailDomain}`,
          password: 'password',
          email_confirm: true,
          phone_confirm: true,
          role: 'authenticated',
          phone: copycat.phoneNumber(role, { prefixes: PHONE_PREFIXES }),
          user_metadata: {
            first_name: copycat.firstName(uuid()),
            last_name: copycat.lastName(uuid()),
            is_admin: role === 'admin',
            is_editor: role === 'editor',
          },
        })
        if (!authData.user) {
          log.error('Error creating users')
          if (authError) throw authError
          return null
        }

        const { error } = await client
          .from('users')
          .update({
            avatar_url: `${placeholderAvatarUrl}?u=${role}`,
            languages: randomRange(LANGUAGES, 1, 3),
            birthday: copycat.dateString(role, { min: '1970-01-01', max: '2000-12-31' }),
            sex: pickRandom(['female', 'male', 'non-binary', null]),
            pronouns: pickRandom(['she/her', 'he/him', 'they/them', null]),
            nationality: copycat.country(pickRandom([role, uuid()])),
            country: copycat.country(role),
            city: copycat.city(role),
            bio: copycat.paragraph(role, { min: 1, max: 3 }),
          })
          .eq('id', authData.user.id)
        if (error) {
          log.warn(`Error updating ${role} public user: ${error.message.toLowerCase()}`)
        }

        return authData.user
      }) as Array<Promise<User>>,
    )
  ).filter(Boolean)
