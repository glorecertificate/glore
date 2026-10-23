import { describe, expect, it } from 'vitest'

import {
  AUDITED_ACTIONS,
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  type AuditLookups,
  type AuditRecord,
  adminAuditQuerySchema,
  auditActionsOf,
  auditCategoryOf,
  auditCertificateIds,
  auditDayEnd,
  auditDayStart,
  auditDetail,
  auditOrganizationIds,
  auditPersonIds,
  toAuditRows,
} from './admin-audit'

const lookups = (overrides: Partial<AuditLookups> = {}): AuditLookups => ({
  certificateCodes: new Map([[7, 'AAAA-BBBB-CCCC']]),
  organizations: new Map([[3, 'Joint']]),
  people: new Map([
    ['admin-1', { email: 'admin@glore.test', id: 'admin-1', name: 'Ada Admin' }],
    ['user-1', { email: 'jo+tag@glore.test', id: 'user-1', name: 'Jo Volunteer' }],
  ]),
  ...overrides,
})

const record = (overrides: Partial<AuditRecord> & Pick<AuditRecord, 'action'>): AuditRecord => ({
  actorId: 'admin-1',
  createdAt: '2026-10-22T10:00:00.000Z',
  id: 1,
  metadata: {},
  organizationId: null,
  subjectId: '',
  ...overrides,
})

describe('audit categories', () => {
  it('lists every audited action once', () => {
    expect(AUDITED_ACTIONS).toHaveLength(new Set(AUDITED_ACTIONS).size)
    expect(AUDITED_ACTIONS).toHaveLength(14)
  })

  it('maps each action back to its category', () => {
    for (const category of AUDIT_CATEGORIES) {
      for (const action of AUDIT_ACTIONS[category]) expect(auditCategoryOf(action)).toBe(category)
    }
    expect(auditCategoryOf('certificate.approved')).toBeNull()
    expect(auditCategoryOf('')).toBeNull()
  })

  it('narrows the actions to a category', () => {
    expect(auditActionsOf(null)).toEqual(AUDITED_ACTIONS)
    expect(auditActionsOf('impersonation')).toEqual(['impersonation.started', 'impersonation.stopped'])
    expect(auditActionsOf('legal')).toEqual(['legal.version_published', 'legal.accepted'])
  })
})

describe('content audit rows', () => {
  it('links a published locale to the course and reads the locale from the metadata', () => {
    const [row] = toAuditRows(
      [
        record({
          action: 'course.locale_published',
          metadata: { entityId: 4, entityType: 'course', locale: 'es', published: true, slug: 'teamwork' },
          subjectId: '4',
        }),
      ],
      lookups()
    )
    expect(row).toMatchObject({
      action: 'course.locale_published',
      category: 'content',
      detail: { locales: ['es'], published: true },
      target: { href: '/courses/teamwork', kind: 'content', label: 'teamwork' },
    })
  })

  it('lists every changed locale of a skill group and links the framework', () => {
    const [row] = toAuditRows(
      [
        record({
          action: 'skill_group.updated',
          metadata: { entityId: 2, entityType: 'skill_group', locales: ['en', 'it'], slug: 'communication' },
          subjectId: '2',
        }),
      ],
      lookups()
    )
    expect(row?.detail.locales).toEqual(['en', 'it'])
    expect(row?.target).toEqual({ href: '/courses/skills', kind: 'content', label: 'communication' })
  })

  it('links reviewed docs to the article', () => {
    const [row] = toAuditRows(
      [
        record({
          action: 'content.translation_reviewed',
          metadata: { count: 1, entityId: 9, entityType: 'doc_article', locale: 'it', slug: 'getting-started' },
          subjectId: '9',
        }),
      ],
      lookups()
    )
    expect(row?.target?.href).toBe('/docs/articles/getting-started')
  })
})

describe('adminAuditQuerySchema', () => {
  it('accepts empty and complete queries', () => {
    expect(adminAuditQuerySchema.safeParse({}).success).toBe(true)
    expect(
      adminAuditQuerySchema.safeParse({
        category: 'moderation',
        from: '2026-01-01',
        page: 2,
        q: 'ada',
        to: '2026-12-31',
      }).success
    ).toBe(true)
  })

  it.each([{ category: 'unknown' }, { from: '01/02/2026' }, { to: '2026-13-40' }, { page: 0 }, { q: 'x'.repeat(201) }])(
    'rejects %o',
    input => {
      expect(adminAuditQuerySchema.safeParse(input).success).toBe(false)
    }
  )

  it('covers a whole day in UTC', () => {
    expect(auditDayStart('2026-12-31')).toBe('2026-12-31T00:00:00.000Z')
    expect(auditDayEnd('2026-12-31')).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('auditDetail', () => {
  it('reads reason, comment, expiry, and approval from the payload', () => {
    expect(
      auditDetail({
        action: 'account.suspended',
        metadata: { expiresAt: '2026-11-01T00:00:00.000Z', reason: 'Spam' },
      })
    ).toEqual({
      approved: null,
      comment: null,
      expiresAt: '2026-11-01T00:00:00.000Z',
      locales: [],
      published: null,
      reason: 'Spam',
      role: null,
    })
    expect(
      auditDetail({ action: 'organization.application_decided', metadata: { approved: false, comment: 'No' } })
    ).toMatchObject({
      approved: false,
      comment: 'No',
    })
  })

  it('reports the role only for team events and falls back to user', () => {
    expect(auditDetail({ action: 'team.role_changed', metadata: { role: 'editor' } }).role).toBe('editor')
    expect(auditDetail({ action: 'team.role_changed', metadata: { role: null } }).role).toBe('user')
    expect(auditDetail({ action: 'account.suspended', metadata: { role: 'admin' } }).role).toBeNull()
  })
})

describe('lookup ids', () => {
  const records = [
    record({ action: 'account.suspended', metadata: { userId: 'user-1' }, organizationId: 3 }),
    record({ action: 'certificate.revoked', actorId: null, metadata: { certificateId: 7, holderId: 'user-2' } }),
    record({ action: 'certificate.revoked', metadata: {}, subjectId: '9' }),
    record({ action: 'team.invited', metadata: { userId: 'user-1' } }),
  ]

  it('collects people, certificates, and organizations once', () => {
    expect(auditPersonIds(records).toSorted()).toEqual(['admin-1', 'user-1', 'user-2'])
    expect(auditCertificateIds(records).toSorted()).toEqual([7, 9])
    expect(auditOrganizationIds(records)).toEqual([3])
  })
})

describe('toAuditRows', () => {
  it('links legal events to the version and its document', () => {
    const [published, accepted] = toAuditRows(
      [
        record({
          action: 'legal.version_published',
          metadata: { effectiveAt: '2026-11-01', material: true, slug: 'terms', version: 2, versionId: 5 },
          subjectId: '5',
        }),
        record({
          action: 'legal.accepted',
          actorId: 'user-1',
          id: 2,
          metadata: { slug: 'terms', userId: 'user-1', version: 2, versionId: 5 },
          subjectId: '5',
        }),
      ],
      lookups()
    )
    expect(published).toMatchObject({
      category: 'legal',
      target: { href: '/legal?document=terms', kind: 'legal', label: 'terms v2' },
    })
    expect(accepted).toMatchObject({ action: 'legal.accepted', category: 'legal' })
  })

  it('resolves the actor and a user target with a searchable link', () => {
    const [row] = toAuditRows(
      [record({ action: 'account.suspended', metadata: { reason: 'Spam', userId: 'user-1' }, subjectId: 'user-1' })],
      lookups()
    )
    expect(row).toMatchObject({
      actor: { name: 'Ada Admin' },
      category: 'moderation',
      target: { href: '/admin/users?q=jo%2Btag%40glore.test', kind: 'user', label: 'Jo Volunteer' },
    })
  })

  it('keeps a row whose actor account was removed', () => {
    const [row] = toAuditRows(
      [record({ action: 'team.invited', actorId: null, metadata: { userId: 'user-1' } })],
      lookups()
    )
    expect(row?.actor).toBeNull()
    expect(row?.target?.label).toBe('Jo Volunteer')
  })

  it('names a certificate by its code and falls back to its id', () => {
    const rows = toAuditRows(
      [
        record({ action: 'certificate.revoked', id: 2, metadata: { certificateId: 7 } }),
        record({ action: 'certificate.revoked', id: 3, metadata: { certificateId: 8 } }),
      ],
      lookups()
    )
    expect(rows.map(({ target }) => target)).toEqual([
      { href: '/certificates/7', kind: 'certificate', label: 'AAAA-BBBB-CCCC' },
      { href: '/certificates/8', kind: 'certificate', label: '#8' },
    ])
  })

  it('names an organization from the lookup, then from the payload', () => {
    const rows = toAuditRows(
      [
        record({ action: 'organization.application_decided', id: 2, organizationId: 3 }),
        record({
          action: 'organization.application_decided',
          id: 3,
          metadata: { organizationName: 'Removed Org' },
          organizationId: 4,
        }),
      ],
      lookups()
    )
    expect(rows.map(({ target }) => target?.label)).toEqual(['Joint', 'Removed Org'])
    expect(rows[0]?.organization).toEqual({ id: 3, name: 'Joint' })
    expect(rows[1]?.organization).toBeNull()
  })

  it('drops actions that are not audited', () => {
    expect(
      toAuditRows([record({ action: 'certificate.approved', metadata: { certificateId: 7 } })], lookups())
    ).toEqual([])
  })

  it('leaves the target empty when nothing resolves', () => {
    const [row] = toAuditRows([record({ action: 'account.reinstated', metadata: { userId: 'ghost' } })], lookups())
    expect(row?.target).toBeNull()
  })
})
