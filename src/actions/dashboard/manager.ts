import 'server-only'

import { listUnassignedOrgCertificates } from '@/actions/certificates/queries'
import { type ManagerSummary, summarizeWaiting } from '@/actions/dashboard/core'
import { getOrganizationPanel } from '@/actions/organizations/queries'

const ACTIVITY_PREVIEW = 5
const AVATAR_PREVIEW = 5

export const loadManagerSummary = async (now: number): Promise<ManagerSummary | null> => {
  const [{ data: panel }, { data: unassigned }] = await Promise.all([
    getOrganizationPanel(),
    listUnassignedOrgCertificates(),
  ])
  if (!panel) return null

  return {
    activeLinks: panel.inviteLinks.filter(({ state }) => state === 'active').length,
    activity: panel.activity.items.slice(0, ACTIVITY_PREVIEW),
    checklist: panel.checklist,
    isOwner: panel.isOrgAdmin,
    members: panel.members.slice(0, AVATAR_PREVIEW).map(member => ({
      id: member.user.id,
      placeholder: member.fullName || member.user.email,
      url: member.user.avatarUrl,
    })),
    pendingInvitations: panel.pendingInvitationsCount,
    pendingJoinRequests: panel.pendingJoinRequestsCount,
    pipeline: panel.pipeline,
    stats: {
      admins: panel.stats.adminCount,
      learners: panel.stats.learnerCount,
      members: panel.stats.memberCount,
      representatives: panel.stats.representativeCount,
      tutors: panel.stats.tutorCount,
      volunteers: panel.stats.volunteerCount,
    },
    waiting: summarizeWaiting(unassigned ?? [], now),
  }
}
