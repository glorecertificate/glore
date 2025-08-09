import { client, STORAGE_URL } from 'supabase/seeds/config'
import { organization } from 'supabase/seeds/data'
import { verifyResponse } from 'supabase/seeds/utils'

export const seedOrganizations = async () => {
  const { avatar, memberships, ...rest } = organization
  const now = new Date().toISOString()
  const rating = Math.round(Math.random() * 5 * 100) / 100
  const avatarUrl = `${STORAGE_URL}/${avatar}`

  const response = await client
    .from('organizations')
    .insert({
      ...rest,
      avatar_url: avatarUrl,
      rating,
      approved_at: now,
      deleted_at: null,
    })
    .select()
  verifyResponse(response, 'memberships')
  return response.data!
}
