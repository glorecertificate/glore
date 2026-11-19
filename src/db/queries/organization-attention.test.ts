import { describe, expect, it } from 'vitest'

import { buildAttention } from '@/db/queries/organization-attention'

const person = (firstName: string) => ({ email: `${firstName}@example.org`, firstName, lastName: 'Rossi' })

const invitation = (id: number, overrides: Record<string, unknown> = {}) => ({
  email: `invitee${id}@example.org`,
  expiresAt: '2026-11-01 10:00:00',
  id,
  invitedById: 'someone',
  role: 'volunteer' as const,
  state: 'expired' as const,
  ...overrides,
})

describe('buildAttention', () => {
  it('lists requests, then changes, then expired invitations, oldest first', () => {
    const items = buildAttention({
      certificates: [{ id: 7, reviewer: person('Tutor'), updatedAt: '2026-11-10 09:00:00', user: person('Giulia') }],
      invitations: [invitation(2), invitation(1, { expiresAt: '2026-10-20 10:00:00' })],
      requests: [
        { createdAt: '2026-11-17 08:00:00', email: 'b@example.org', firstName: 'Marta', id: 4, lastName: null },
        { createdAt: '2026-11-12 08:00:00', email: 'a@example.org', firstName: 'Luca', id: 3, lastName: null },
      ],
      role: 'admin',
      userId: 'me',
    })
    expect(items.map(({ id, kind }) => `${kind}:${id}`)).toEqual([
      'request:3',
      'request:4',
      'changes:7',
      'expired:1',
      'expired:2',
    ])
    expect(items[2]).toMatchObject({ holder: 'Giulia Rossi', tutor: 'Tutor Rossi' })
  })

  it('hides expired invitations the viewer cannot manage', () => {
    const items = buildAttention({
      certificates: [],
      invitations: [invitation(1, { role: 'admin' }), invitation(2, { invitedById: 'me', role: 'admin' })],
      requests: [],
      role: 'representative',
      userId: 'me',
    })
    expect(items.map(({ id }) => id)).toEqual([2])
  })

  it('ignores invitations that are not expired and caps the list', () => {
    const requests = Array.from({ length: 9 }, (_, index) => ({
      createdAt: `2026-11-0${index + 1} 08:00:00`,
      email: `r${index}@example.org`,
      firstName: `R${index}`,
      id: index + 1,
      lastName: null,
    }))
    const items = buildAttention({
      certificates: [],
      invitations: [invitation(1, { state: 'pending' })],
      requests,
      role: 'admin',
      userId: 'me',
    })
    expect(items).toHaveLength(6)
    expect(items.every(({ kind }) => kind === 'request')).toBe(true)
  })
})
