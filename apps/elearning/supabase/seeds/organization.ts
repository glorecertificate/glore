import { seedClient, seeder, verifyResponse } from './shared'

export const seedOrganizations = async () => {
  const { avatar, memberships, ...rest } = seeder.organization
  const now = new Date().toISOString()
  const rating = Math.round(Math.random() * 5 * 100) / 100
  const avatarUrl = `${process.env.STORAGE_URL}/${avatar}`

  const response = await seedClient
    .from('organizations')
    .insert({
      ...rest,
      approved_at: now,
      avatar_url: avatarUrl,
      deleted_at: null,
      rating,
    })
    .select()
  verifyResponse(response, 'memberships')

  return response.data!
}
