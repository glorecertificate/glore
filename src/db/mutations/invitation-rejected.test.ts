import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/db/client', () => ({ db: {}, transaction: vi.fn() }))

const { acceptInvitation, assertOrganizationOpen, createInvitation, createInviteLink, resendInvitation } =
  await import('@/db/mutations/invitation')

const rejectedTx = (organization: unknown) =>
  ({
    insert: vi.fn(),
    query: {
      organizationInvitations: { findFirst: vi.fn().mockResolvedValue({ id: 1, organization: { name: 'Org' } }) },
      organizations: { findFirst: vi.fn().mockResolvedValue(organization) },
      users: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  }) as never

const REJECTED = { approvedAt: null, id: 1, joinRequests: [{ id: 9 }], name: 'Org' }
const PENDING = { approvedAt: null, id: 1, joinRequests: [], name: 'Org' }
const APPROVED = { approvedAt: '2026-01-01', id: 1, joinRequests: [], name: 'Org' }

describe('rejected organization invite guard', () => {
  it('refuses a rejected organization', async () => {
    await expect(assertOrganizationOpen(rejectedTx(REJECTED), 1)).rejects.toMatchObject({
      code: 'ORGANIZATION_REJECTED',
    })
  })

  it('allows pending and approved organizations', async () => {
    await expect(assertOrganizationOpen(rejectedTx(PENDING), 1)).resolves.toBeUndefined()
    await expect(assertOrganizationOpen(rejectedTx(APPROVED), 1)).resolves.toBeUndefined()
  })

  it('blocks invitations, resends, and invite links before any write', async () => {
    const tx = rejectedTx(REJECTED)
    const base = { email: 'a@b.test', expiryDays: 7, invitedById: 'u', organizationId: 1, role: 'volunteer' } as const

    await expect(createInvitation(tx, base)).rejects.toMatchObject({ code: 'ORGANIZATION_REJECTED' })
    await expect(
      resendInvitation(tx, { actorId: 'u', expiryDays: 7, invitationId: 1, organizationId: 1 })
    ).rejects.toMatchObject({ code: 'ORGANIZATION_REJECTED' })
    await expect(
      createInviteLink(tx, {
        createdById: 'u',
        expiryDays: null,
        maxUses: null,
        organizationId: 1,
        requiresApproval: false,
        role: 'volunteer',
      })
    ).rejects.toMatchObject({ code: 'ORGANIZATION_REJECTED' })
    expect((tx as { insert: ReturnType<typeof vi.fn> }).insert).not.toHaveBeenCalled()
    expect((tx as { update: ReturnType<typeof vi.fn> }).update).not.toHaveBeenCalled()
  })

  it('blocks accepting an earlier invitation before any membership write', async () => {
    const pending = {
      acceptedAt: null,
      declinedAt: null,
      email: 'a@b.test',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      id: 1,
      organization: { id: 1, name: 'Org' },
      organizationId: 1,
      revokedAt: null,
      role: 'volunteer',
      userId: null,
    }
    const tx = rejectedTx(REJECTED) as unknown as {
      insert: ReturnType<typeof vi.fn>
      query: { organizationInvitations: { findFirst: ReturnType<typeof vi.fn> } }
      update: ReturnType<typeof vi.fn>
    }
    tx.query.organizationInvitations.findFirst.mockResolvedValue(pending)

    await expect(
      acceptInvitation(tx as never, { token: 'token', user: { email: 'a@b.test', id: 'u' } })
    ).rejects.toMatchObject({ code: 'ORGANIZATION_REJECTED' })
    expect(tx.insert).not.toHaveBeenCalled()
    expect(tx.update).not.toHaveBeenCalled()
  })
})
