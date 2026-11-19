import { type AdminUserRow } from '@/db/queries/admin-user'
import { fullName } from '@/lib/utils'

export const userLabel = (user: Pick<AdminUserRow, 'email' | 'firstName' | 'lastName' | 'username'>) =>
  fullName(user) || (user.username ? `@${user.username}` : user.email)

export const userInitials = (user: Pick<AdminUserRow, 'firstName' | 'lastName'>) =>
  [user.firstName, user.lastName]
    .flatMap(name => (name?.trim() ? [name.trim().charAt(0).toUpperCase()] : []))
    .slice(0, 2)
    .join('')

export const listFocusTarget = () => document.querySelector<HTMLElement>('[data-slot="data-table"]')

interface OrganizationStateInput {
  approvedAt: string | Date | null
  joinRequests: { isRejected: boolean; role: string }[]
  invitations: { state: string }[]
  memberships: unknown[]
  motivation: string | null
}

export const organizationState = (organization: OrganizationStateInput) => {
  const request = organization.joinRequests.find(item => item.role === 'admin')
  const hasApplication = Boolean(request || organization.motivation)
  const isApproved = Boolean(organization.approvedAt)
  const isRejected = !isApproved && organization.joinRequests.some(item => item.role === 'admin' && item.isRejected)

  return {
    hasApplication,
    isApproved,
    isPending: !(isApproved || isRejected),
    isRejected,
    members: organization.memberships.length,
    pendingInvitations: organization.invitations.filter(({ state }) => state === 'pending').length,
  }
}
