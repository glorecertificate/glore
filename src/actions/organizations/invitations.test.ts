import { updateTag } from 'next/cache'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createOrganizationInviteLink,
  inviteOrganizationMembers,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  revokeOrganizationInviteLink,
} from '@/actions/organizations/invitations'
import { CacheTag } from '@/lib/cache'

vi.mock('next/cache', () => ({ updateTag: vi.fn() }))
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/actions/organizations/helpers', () => ({
  assertOrganizationManager: vi.fn(),
  getOrganizationAccess: () => Promise.resolve({ organizationId: 7, role: 'admin', user: { id: 'manager' } }),
}))
vi.mock('@/actions/organizations/invite-core', async () => {
  const actual = await vi.importActual<typeof import('@/actions/organizations/invite-core')>(
    '@/actions/organizations/invite-core'
  )
  return { ...actual, sendInvitations: () => Promise.resolve({ rows: [] }) }
})
vi.mock('@/db/client', () => ({
  db: {
    query: {
      organizationInvitations: { findFirst: () => Promise.resolve({ id: 1, invitedById: 'manager', role: 'learner' }) },
    },
  },
  transaction: (run: (tx: unknown) => unknown) => Promise.resolve(run({})),
}))
vi.mock('@/db/mutations/invitation', async () => {
  const actual = await vi.importActual<typeof import('@/db/mutations/invitation')>('@/db/mutations/invitation')
  return {
    ...actual,
    createInviteLink: () => ({ event: {}, link: { id: 3 }, token: 'token' }),
    resendInvitation: () => ({ event: {} }),
    revokeInvitation: () => ({ event: {} }),
    revokeInviteLink: () => ({ event: {} }),
  }
})
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: () => Promise.resolve(false) }))

describe('organization invitation cache invalidation', () => {
  beforeEach(() => {
    vi.mocked(updateTag).mockClear()
  })

  it.each([
    ['send', () => inviteOrganizationMembers({ emails: ['a@example.com'], locale: 'en', role: 'learner' })],
    ['resend', () => resendOrganizationInvitation(1)],
    ['revoke', () => revokeOrganizationInvitation(1)],
    [
      'link create',
      () => createOrganizationInviteLink({ expiryDays: 7, maxUses: null, requiresApproval: false, role: 'learner' }),
    ],
    ['link revoke', () => revokeOrganizationInviteLink(3)],
  ])('expires the organization tag after %s', async (_name, run) => {
    const { error } = await run()
    expect(error).toBeNull()
    expect(vi.mocked(updateTag)).toHaveBeenCalledWith(CacheTag.Organizations)
  })
})
