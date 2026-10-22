import { type OrganizationMembershipRole } from '@/db/queries/organization'

export interface ScopeViewer {
  canEdit: boolean
  id: string
  organizationId: number | null
  role: OrganizationMembershipRole | null
}

export type CertificateScope =
  | { kind: 'organization'; organizationId: number }
  | { kind: 'own'; userId: string }
  | { kind: 'reviewer'; organizationId: number; userId: string }

export interface MemberScope {
  organizationId: number
}

export const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100
export const SEARCH_LIMIT = 6

export const certificateScopes = ({ canEdit, id, organizationId, role }: ScopeViewer): CertificateScope[] => {
  if (canEdit) return []
  const own: CertificateScope = { kind: 'own', userId: id }
  if (!organizationId) return [own]
  if (role === 'admin' || role === 'representative') return [own, { kind: 'organization', organizationId }]
  if (role === 'tutor') return [own, { kind: 'reviewer', organizationId, userId: id }]
  return [own]
}

export const memberScope = ({ canEdit, organizationId, role }: ScopeViewer): MemberScope | null => {
  if (canEdit || !organizationId) return null
  if (role === 'admin' || role === 'representative') return { organizationId }
  return null
}

export const normalizeQuery = (query: string) => {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH)
  return trimmed.length >= MIN_QUERY_LENGTH ? trimmed : null
}

export const likePattern = (query: string) => `%${query.replace(/[\\%_]/gu, match => `\\${match}`)}%`
