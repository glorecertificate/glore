import { type StatusMeta } from '@/components/ui/status-badge'
import { type InvitationState, type InviteLinkState } from '@/db/queries/organization'

export const INVITATION_STATUS = {
  accepted: { icon: 'circle-check', labelKey: 'state_accepted', tone: 'success' },
  declined: { icon: 'circle-x', labelKey: 'state_declined', tone: 'neutral' },
  expired: { icon: 'clock', labelKey: 'state_expired', tone: 'warning' },
  pending: { icon: 'send', labelKey: 'state_pending', tone: 'info' },
  revoked: { icon: 'ban', labelKey: 'state_revoked', tone: 'danger' },
} as const satisfies Record<InvitationState, StatusMeta>

export const INVITE_LINK_STATUS = {
  active: { icon: 'circle-check', labelKey: 'linkState_active', tone: 'success' },
  exhausted: { icon: 'circle-dashed', labelKey: 'linkState_exhausted', tone: 'neutral' },
  expired: { icon: 'clock', labelKey: 'linkState_expired', tone: 'warning' },
  revoked: { icon: 'ban', labelKey: 'linkState_revoked', tone: 'danger' },
} as const satisfies Record<InviteLinkState, StatusMeta>
