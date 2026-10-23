import { describe, expect, it } from 'vitest'

import {
  type NavigationId,
  type NavigationViewer,
  adminSectionHref,
  entriesFor,
  matchesEntry,
  showsOrganizationSwitcher,
  sidebarEntriesFor,
} from '@/components/layout/navigation'

const viewer = (overrides: Partial<NavigationViewer> = {}): NavigationViewer => ({
  canEdit: false,
  isAdmin: false,
  role: 'volunteer',
  ...overrides,
})

const sidebar = (value: NavigationViewer): NavigationId[] => sidebarEntriesFor(value).map(({ id }) => id)
const ids = (value: NavigationViewer, group?: Parameters<typeof entriesFor>[1]): NavigationId[] =>
  entriesFor(value, group).map(({ id }) => id)

describe('sidebar per role', () => {
  it('gives volunteers and tutors courses, certificates, and docs', () => {
    for (const role of ['volunteer', 'tutor'] as const) {
      expect(sidebar(viewer({ role }))).toEqual(['dashboard', 'courses', 'certificates', 'docs'])
    }
  })

  it('hides certificates from learners', () => {
    expect(sidebar(viewer({ role: 'learner' }))).toEqual(['dashboard', 'courses', 'docs'])
  })

  it('adds the organization to owners and representatives', () => {
    for (const role of ['admin', 'representative'] as const) {
      expect(sidebar(viewer({ role }))).toEqual(['dashboard', 'organization', 'courses', 'certificates', 'docs'])
    }
  })

  it('never shows the member interface to team members (D25)', () => {
    for (const role of ['admin', 'representative', 'tutor', 'volunteer', null] as const) {
      expect(sidebar(viewer({ canEdit: true, role }))).toEqual(['dashboard', 'courses', 'docs'])
      expect(sidebar(viewer({ canEdit: true, isAdmin: true, role }))).toEqual(['dashboard', 'courses', 'docs'])
    }
  })

  it('keeps certificates for users who left every organization', () => {
    expect(sidebar(viewer({ role: null }))).toContain('certificates')
  })
})

describe('palette entries', () => {
  it('lists admin pages for platform admins, and translations, email previews, and legal texts for editors', () => {
    expect(ids(viewer({ canEdit: true, isAdmin: true, role: null }), 'admin')).toEqual([
      'admin-overview',
      'admin-team',
      'admin-organizations',
      'admin-users',
      'admin-certificates',
      'admin-audit',
      'admin-translations',
      'admin-emails',
      'admin-legal',
    ])
    expect(ids(viewer({ canEdit: true, role: null }), 'admin')).toEqual([
      'admin-translations',
      'admin-emails',
      'admin-legal',
    ])
    expect(ids(viewer({ role: 'admin' }), 'admin')).toEqual([])
  })

  it('lists organization tabs for managers, with settings for the owner only', () => {
    const representative = ids(viewer({ role: 'representative' }), 'organization')
    const owner = ids(viewer({ role: 'admin' }), 'organization')
    expect(representative).toHaveLength(7)
    expect(representative).not.toContain('organization-settings')
    expect(owner).toContain('organization-settings')
    for (const role of ['learner', 'tutor', 'volunteer'] as const) {
      expect(ids(viewer({ role }), 'organization')).toEqual([])
    }
    expect(ids(viewer({ canEdit: true, role: 'admin' }), 'organization')).toEqual([])
  })

  it('lists every settings tab for everyone', () => {
    for (const value of [viewer(), viewer({ canEdit: true, isAdmin: true, role: null })]) {
      expect(ids(value, 'settings')).toHaveLength(7)
    }
  })

  it('offers quick actions that match the role', () => {
    expect(ids(viewer({ role: 'volunteer' }), 'actions')).toEqual(['request-certificate', 'register-organization'])
    expect(ids(viewer({ role: 'tutor' }), 'actions')).toEqual(['register-organization'])
    expect(ids(viewer({ role: 'representative' }), 'actions')).toEqual(['invite-members', 'register-organization'])
    expect(ids(viewer({ canEdit: true, role: null }), 'actions')).toEqual(['skills-framework'])
  })
})

describe('adminSectionHref', () => {
  it('points platform admins at the admin overview', () => {
    expect(adminSectionHref(viewer({ canEdit: true, isAdmin: true, role: null }))).toBe('/admin')
  })

  it('points editors at the first page they can open', () => {
    expect(adminSectionHref(viewer({ canEdit: true, role: null }))).toBe('/translations')
  })

  it('is null without admin entries', () => {
    expect(adminSectionHref(viewer({ role: 'admin' }))).toBeNull()
  })
})

describe('organization switcher', () => {
  it('hides for team members', () => {
    expect(showsOrganizationSwitcher({ canEdit: true })).toBe(false)
    expect(showsOrganizationSwitcher({ canEdit: false })).toBe(true)
  })
})

describe('matchesEntry', () => {
  it('requires every term, in any order, ignoring case', () => {
    expect(matchesEntry('Organization members', 'MEMBERS org')).toBe(true)
    expect(matchesEntry('Organization members', 'members tutor')).toBe(false)
    expect(matchesEntry('Anything', '')).toBe(true)
  })
})
