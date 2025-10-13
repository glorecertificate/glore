import { faker } from '@faker-js/faker'

import { randomItem, randomRange } from '@glore/utils/random'

import { type Enums } from '@/lib/db'
import { seedClient, seeder, verifyResponse } from './shared'

const { avatar, domain } = seeder.user

const randomUserDetails = () => {
  const sex = randomItem(seeder.user.sex)
  const gender = ['male', 'female'].includes(sex ?? '') ? (sex as 'male' | 'female') : undefined
  const pronouns =
    sex === 'male'
      ? 'he/him'
      : sex === 'female'
        ? 'she/her'
        : sex === 'non-binary'
          ? randomItem(seeder.user.pronouns)
          : undefined

  return { gender, pronouns, sex }
}

export const seedUsers = async (roles = seeder.user.roles) =>
  await Promise.all(
    roles.map(async (role, i) => {
      faker.seed(i)

      const country = randomItem(seeder.countries)
      const userLanguages = [...new Set([...country.languages, ...randomRange(seeder.languages, 0, 3)])]
      const { gender, pronouns, sex } = randomUserDetails()
      const name = faker.person.firstName(gender)
      const phone = randomItem([`${country.prefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`, undefined])

      const authResponse = await seedClient.auth.admin.createUser({
        email: `${role}@${domain}`,
        email_confirm: true,
        password: 'password',
        phone,
        phone_confirm: true,
        role: 'authenticated',
        user_metadata: {
          first_name: name,
          is_admin: role === 'admin',
          is_editor: role === 'editor',
          last_name: faker.person.lastName(gender),
        },
      })
      verifyResponse(authResponse, 'users')
      const authUser = authResponse.data.user!

      const avatarParams = new URLSearchParams()
      avatarParams.set('seed', name)

      for (const [key, value] of Object.entries(avatar.params)) {
        const param = Array.isArray(value) ? value.join(',') : String(value)
        avatarParams.set(key, param)
      }

      const publicResponse = await seedClient
        .from('users')
        .update({
          avatar_url: `${avatar.url}/${avatar.style}/png?${avatarParams.toString()}`,
          bio: faker.lorem.paragraph(),
          birthday: faker.date.between({ from: '1970-01-01', to: '2000-12-31' }).toISOString(),
          city: faker.location.city(),
          country: country.code,
          languages: userLanguages,
          pronouns,
          sex: sex as Enums<'sex'>,
        })
        .eq('id', authUser.id)
        .select()
      verifyResponse(publicResponse, 'users')

      return authUser
    })
  )
