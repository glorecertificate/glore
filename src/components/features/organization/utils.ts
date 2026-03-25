import { type useTranslations } from 'next-intl'
import { z } from 'zod'

import { type OrganizationMembershipRole } from '@/db/queries/organization'

export const MANAGEABLE_MEMBER_ROLES: OrganizationMembershipRole[] = ['learner', 'representative', 'tutor', 'volunteer']
export const REPRESENTATIVE_INVITE_ROLES: OrganizationMembershipRole[] = ['learner', 'tutor', 'volunteer']

export const organizationSettingsSchema = z.object({
  address: z.string(),
  city: z.string().min(1),
  country: z.string(),
  description: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string(),
  postcode: z.string(),
  region: z.string(),
  url: z.string(),
})

export const getDisplayName = ({
  email,
  firstName,
  lastName,
  username,
}: {
  email: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
}) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  if (firstName) {
    return firstName
  }

  if (username) {
    return `@${username}`
  }

  return email
}

export const formatRoleLabel = (
  role: OrganizationMembershipRole,
  t: ReturnType<typeof useTranslations<'Organization'>>
) => t(`role_${role}`)
