import { describe, expect, it } from 'vitest'

import { type ScopeViewer, certificateScopes, likePattern, memberScope, normalizeQuery } from '@/actions/shell/scope'

const viewer = (overrides: Partial<ScopeViewer> = {}): ScopeViewer => ({
  canEdit: false,
  id: 'user-1',
  organizationId: 7,
  role: 'volunteer',
  ...overrides,
})

describe('certificateScopes', () => {
  it('limits volunteers and learners to their own certificates', () => {
    expect(certificateScopes(viewer())).toEqual([{ kind: 'own', userId: 'user-1' }])
    expect(certificateScopes(viewer({ role: 'learner' }))).toEqual([{ kind: 'own', userId: 'user-1' }])
  })

  it('limits users without an organization to their own certificates', () => {
    expect(certificateScopes(viewer({ organizationId: null, role: null }))).toEqual([{ kind: 'own', userId: 'user-1' }])
  })

  it('adds the reviewer scope of the active organization for tutors', () => {
    expect(certificateScopes(viewer({ role: 'tutor' }))).toEqual([
      { kind: 'own', userId: 'user-1' },
      { kind: 'reviewer', organizationId: 7, userId: 'user-1' },
    ])
  })

  it('adds the active organization for owners and representatives', () => {
    for (const role of ['admin', 'representative'] as const) {
      expect(certificateScopes(viewer({ role }))).toEqual([
        { kind: 'own', userId: 'user-1' },
        { kind: 'organization', organizationId: 7 },
      ])
    }
  })

  it('returns nothing for team members, whatever their membership', () => {
    expect(certificateScopes(viewer({ canEdit: true, role: 'admin' }))).toEqual([])
  })
})

describe('memberScope', () => {
  it('allows managers inside the active organization only', () => {
    expect(memberScope(viewer({ role: 'admin' }))).toEqual({ organizationId: 7 })
    expect(memberScope(viewer({ role: 'representative' }))).toEqual({ organizationId: 7 })
  })

  it('denies every other role, team members, and users without an organization', () => {
    for (const role of ['learner', 'tutor', 'volunteer'] as const) {
      expect(memberScope(viewer({ role }))).toBeNull()
    }
    expect(memberScope(viewer({ canEdit: true, role: 'admin' }))).toBeNull()
    expect(memberScope(viewer({ organizationId: null, role: null }))).toBeNull()
  })
})

describe('query helpers', () => {
  it('rejects short queries and trims long ones', () => {
    expect(normalizeQuery(' a ')).toBeNull()
    expect(normalizeQuery('  ab ')).toBe('ab')
    expect(normalizeQuery('x'.repeat(300))).toHaveLength(100)
  })

  it('escapes like wildcards', () => {
    expect(likePattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%')
  })
})
