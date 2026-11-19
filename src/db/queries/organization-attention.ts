import {
  type OrganizationInvitation,
  type OrganizationJoinRequest,
  type OrganizationMembershipRole,
  canManageInvitation,
} from '@/db/queries/organization'
import { fullName } from '@/lib/utils'

const ATTENTION_LIMIT = 6

export type AttentionItem =
  | { at: string; holder: string; id: number; kind: 'changes'; tutor: string | null }
  | { at: string; email: string; id: number; kind: 'expired' }
  | { at: string; id: number; kind: 'request'; name: string }

export interface AttentionCertificate {
  id: number
  reviewer: { email: string; firstName: string; lastName: string | null } | null
  updatedAt: string
  user: { email: string; firstName: string; lastName: string | null } | null
}

const byDate = (a: { at: string }, b: { at: string }) => a.at.localeCompare(b.at)

export const buildAttention = ({
  certificates,
  invitations,
  requests,
  role,
  userId,
}: {
  certificates: AttentionCertificate[]
  invitations: Pick<OrganizationInvitation, 'email' | 'expiresAt' | 'id' | 'invitedById' | 'role' | 'state'>[]
  requests: Pick<OrganizationJoinRequest, 'createdAt' | 'email' | 'firstName' | 'id' | 'lastName'>[]
  role: OrganizationMembershipRole
  userId: string
}): AttentionItem[] => {
  const asked: AttentionItem[] = requests
    .map(request => ({
      at: request.createdAt,
      id: request.id,
      kind: 'request' as const,
      name: fullName(request) || request.email,
    }))
    .toSorted(byDate)
  const changed: AttentionItem[] = certificates
    .map(certificate => ({
      at: certificate.updatedAt,
      holder: (certificate.user && (fullName(certificate.user) || certificate.user.email)) || '',
      id: certificate.id,
      kind: 'changes' as const,
      tutor: certificate.reviewer ? fullName(certificate.reviewer) || certificate.reviewer.email : null,
    }))
    .toSorted(byDate)
  const expired: AttentionItem[] = invitations
    .flatMap(invitation =>
      invitation.state === 'expired' && canManageInvitation(role, invitation, userId)
        ? [{ at: invitation.expiresAt, email: invitation.email, id: invitation.id, kind: 'expired' as const }]
        : []
    )
    .toSorted(byDate)
  return [...asked, ...changed, ...expired].slice(0, ATTENTION_LIMIT)
}
