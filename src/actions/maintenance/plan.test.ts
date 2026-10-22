import { describe, expect, it } from 'vitest'

import {
  type FiredReviewEvent,
  type OpenInvitation,
  type OpenReview,
  planInvitationReminders,
  planReviewActions,
  selectOrphanPdfKeys,
} from '@/actions/maintenance/plan'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-10-22T12:00:00.000Z')
const ago = (days: number) => new Date(NOW - days * DAY).toISOString()

const review = (overrides: Partial<OpenReview> = {}): OpenReview => ({
  holderId: 'holder',
  id: 1,
  organizationId: 1,
  reviewerId: 'tutor',
  submittedAt: ago(4),
  ...overrides,
})

const plan = (certificates: OpenReview[], fired: FiredReviewEvent[] = []) =>
  planReviewActions({ certificates, fired, now: NOW, thresholds: [3, 7] })

describe('planReviewActions', () => {
  it('does nothing before the first threshold', () => {
    expect(plan([review({ submittedAt: ago(2) })])).toEqual([])
  })

  it('reminds an assigned tutor after the first threshold', () => {
    const [action, ...rest] = plan([review()])
    expect(rest).toEqual([])
    expect(action).toMatchObject({ days: 3, kind: 'reminder' })
  })

  it('does not repeat a fired reminder', () => {
    const fired: FiredReviewEvent[] = [{ certificateId: 1, createdAt: ago(1), days: 3, kind: 'reminder' }]
    expect(plan([review()], fired)).toEqual([])
  })

  it('reminds and escalates at the last threshold', () => {
    const kinds = plan([review({ submittedAt: ago(8) })]).map(({ days, kind }) => `${kind}:${days}`)
    expect(kinds).toEqual(['reminder:7', 'escalated:7'])
  })

  it('escalates an unassigned certificate without a reminder', () => {
    const kinds = plan([review({ reviewerId: null, submittedAt: ago(8) })]).map(({ kind }) => kind)
    expect(kinds).toEqual(['escalated'])
  })

  it('ignores events fired before the latest submission', () => {
    const fired: FiredReviewEvent[] = [{ certificateId: 1, createdAt: ago(10), days: 3, kind: 'reminder' }]
    expect(plan([review()], fired)).toHaveLength(1)
  })
})

describe('planInvitationReminders', () => {
  const invitation = (overrides: Partial<OpenInvitation> = {}): OpenInvitation => ({
    createdAt: ago(5),
    expiresAt: new Date(NOW + 2 * DAY).toISOString(),
    id: 1,
    lastSentAt: null,
    ...overrides,
  })

  const run = (invitations: OpenInvitation[], fired: { createdAt: string; invitationId: number }[] = []) =>
    planInvitationReminders({ fired, invitations, now: NOW, reminderDay: 5 })

  it('selects invitations sent long enough ago', () => {
    expect(run([invitation()])).toHaveLength(1)
    expect(run([invitation({ createdAt: ago(4) })])).toEqual([])
  })

  it('measures from the last resend', () => {
    expect(run([invitation({ lastSentAt: ago(1) })])).toEqual([])
  })

  it('skips expired invitations', () => {
    expect(run([invitation({ expiresAt: ago(1) })])).toEqual([])
  })

  it('sends once per send', () => {
    expect(run([invitation()], [{ createdAt: ago(0), invitationId: 1 }])).toEqual([])
    expect(run([invitation({ lastSentAt: ago(5) })], [{ createdAt: ago(9), invitationId: 1 }])).toHaveLength(1)
  })
})

describe('selectOrphanPdfKeys', () => {
  const cutoff = new Date(NOW - DAY)
  const old = new Date(NOW - 3 * DAY)
  const fresh = new Date(NOW - 1000)

  it('keeps referenced, revoked and fresh files', () => {
    const keys = selectOrphanPdfKeys(
      [
        { key: 'certificates/live.pdf', lastModified: old },
        { key: 'certificates/revoked.pdf', lastModified: old },
        { key: 'certificates/stray.pdf', lastModified: old },
        { key: 'certificates/new.pdf', lastModified: fresh },
        { key: 'certificates/linked.pdf', lastModified: old },
      ],
      [
        { documentUrl: 'https://cdn.example.com/certificates/live.pdf', handle: 'live' },
        { documentUrl: null, handle: 'revoked' },
        { documentUrl: 'https://cdn.example.com/certificates/linked.pdf', handle: 'other' },
      ],
      cutoff
    )
    expect(keys).toEqual(['certificates/stray.pdf'])
  })
})
