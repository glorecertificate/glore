import { type useTranslations } from 'next-intl'

import { type OrganizationMembershipRole } from '@/db/queries/organization'

export const MANAGEABLE_MEMBER_ROLES: OrganizationMembershipRole[] = ['learner', 'representative', 'tutor', 'volunteer']
export const REPRESENTATIVE_INVITE_ROLES: OrganizationMembershipRole[] = ['learner', 'tutor', 'volunteer']

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

export const maskEmail = (email: string) => {
  const [local = '', domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 1)}${'*'.repeat(Math.min(Math.max(local.length - 1, 2), 6))}@${domain}`
}

export const parseEmails = (text: string) => [
  ...new Set(
    text.split(/[\s,;]+/u).flatMap(item => {
      const email = item.replaceAll(/^[<"']+|[>"']+$/gu, '').toLowerCase()
      return email ? [email] : []
    })
  ),
]
