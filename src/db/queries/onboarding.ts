import { type OrganizationMembershipRole } from '@/db/queries/organization'

export type OnboardingNextStep = 'catalog' | 'compass' | 'organization' | 'queue'

export const ONBOARDING_NEXT_HREFS = {
  catalog: '/courses',
  compass: '/courses',
  organization: '/organization',
  queue: '/certificates',
} as const satisfies Record<OnboardingNextStep, string>

export const onboardingNextStep = (roles: OrganizationMembershipRole[]): OnboardingNextStep => {
  if (roles.includes('tutor')) return 'queue'
  if (roles.includes('admin') || roles.includes('representative')) return 'organization'
  if (roles.includes('learner') || roles.includes('volunteer')) return 'compass'
  return 'catalog'
}
