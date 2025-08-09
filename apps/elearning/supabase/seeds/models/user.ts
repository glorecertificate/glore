import { faker } from '@faker-js/faker'

import { pickRandom, randomRange } from '@repo/utils'

import { client } from 'supabase/seeds/config'
import { countries, languages, user } from 'supabase/seeds/data'
import { randomUserDetails, verifyResponse } from 'supabase/seeds/utils'

export const seedUsers = async (roles = user.roles) =>
  await Promise.all(
    roles.map(async (role, i) => {
      faker.seed(i)

      const country = pickRandom(countries)
      const userLanguages = [...new Set([...country.languages, ...randomRange(languages, 0, 3)])]
      const { gender, pronouns, sex } = randomUserDetails()
      const phone = pickRandom([`${country.prefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`, undefined])

      const authResponse = await client.auth.admin.createUser({
        email: `${role}@${user.domain}`,
        password: 'password',
        email_confirm: true,
        phone_confirm: true,
        role: 'authenticated',
        phone,
        user_metadata: {
          first_name: faker.person.firstName(gender),
          last_name: faker.person.lastName(gender),
          is_admin: role === 'admin',
          is_editor: role === 'editor',
        },
      })
      verifyResponse(authResponse, 'users')
      const authUser = authResponse.data.user!

      const publicResponse = await client
        .from('users')
        .update({
          sex,
          pronouns,
          languages: userLanguages,
          birthday: faker.date.between({ from: '1970-01-01', to: '2000-12-31' }).toISOString(),
          avatar_url:
            Math.random() < 0.8
              ? `${user.avatarUrl}/${user.avatarStyle}/png?seed=${authUser.email!}&backgroundColor=${user.avatarColors.join(',')}`
              : undefined,
          country: country.code,
          city: faker.location.city(),
          bio: faker.lorem.paragraph(),
        })
        .eq('id', authUser.id)
        .select()
      verifyResponse(publicResponse, 'users')

      return authUser
    }),
  )
