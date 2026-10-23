import { and, eq, gt, inArray, max } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX, SEED_ORG_HANDLE, seedEmail } from '~/scripts/seed-data'

const sendMail = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendMail }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const SEED_KEYS = ['admin', 'owner', 'representative', 'tutor', 'volunteer'] as const

describe.skipIf(!isLocalDatabase)('notify', () => {
  let context: {
    catalog: typeof import('@/actions/notifications/catalog')
    client: typeof import('@/db/client')
    ids: Record<(typeof SEED_KEYS)[number], string>
    notify: typeof import('@/actions/notifications/notify')
    organizationId: number
    schema: typeof import('@/db/schema')
  }

  const certificate = (overrides: { tutorId?: string | null } = {}) => ({
    certificateId: -1,
    holderId: context.ids.volunteer,
    tutorId: null,
    ...overrides,
  })

  const cleanup = async () => {
    const { client, ids, schema } = context
    await client.db
      .delete(schema.notifications)
      .where(
        and(
          inArray(schema.notifications.userId, Object.values(ids)),
          eq(schema.notifications.type, 'certificate.review_escalated')
        )
      )
    await client.db
      .update(schema.users)
      .set({ notificationPreferences: {} })
      .where(eq(schema.users.id, ids.representative))
  }

  beforeAll(async () => {
    const [catalog, client, notify, schema] = await Promise.all([
      import('@/actions/notifications/catalog'),
      import('@/db/client'),
      import('@/actions/notifications/notify'),
      import('@/db/schema'),
    ])
    const [people, organization] = await Promise.all([
      client.db.query.users.findMany({
        columns: { email: true, id: true },
        where: inArray(
          schema.users.email,
          SEED_KEYS.map(key => seedEmail(key))
        ),
      }),
      client.db.query.organizations.findFirst({
        columns: { id: true },
        where: eq(schema.organizations.handle, SEED_ORG_HANDLE),
      }),
    ])
    const ids = Object.fromEntries(
      SEED_KEYS.map(key => [key, people.find(({ email }) => email === seedEmail(key))?.id])
    ) as Record<(typeof SEED_KEYS)[number], string>
    if (!(organization && SEED_KEYS.every(key => ids[key]))) throw new Error('Run pnpm run db:seed first')
    context = { catalog, client, ids, notify, organizationId: organization.id, schema }
    await cleanup()
  })

  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'd'.repeat(43).concat('='))
    sendMail.mockClear()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('sends an unassigned request to the tutor pool, never to its author', async () => {
    const { catalog, ids, organizationId } = context
    const recipients = await catalog.EVENT_DEFINITIONS['certificate.submitted'].inApp?.({
      actorId: ids.volunteer,
      data: certificate(),
      organizationId,
      type: 'certificate.submitted',
    })

    expect(recipients).toEqual([ids.tutor])
  })

  it('sends an assigned request only to its tutor', async () => {
    const { catalog, ids, organizationId } = context
    const recipients = await catalog.EVENT_DEFINITIONS['certificate.submitted'].inApp?.({
      actorId: ids.volunteer,
      data: certificate({ tutorId: ids.owner }),
      organizationId,
      type: 'certificate.submitted',
    })

    expect(recipients).toEqual([ids.owner])
  })

  it('escalates to the owner and representatives', async () => {
    const { catalog, ids, organizationId } = context
    const recipients = await catalog.EVENT_DEFINITIONS['certificate.review_escalated'].inApp?.({
      actorId: null,
      data: { certificateId: -1, days: 8, holderId: ids.volunteer, tutorId: ids.tutor },
      organizationId,
      type: 'certificate.review_escalated',
    })

    expect(recipients?.toSorted()).toEqual([ids.owner, ids.representative].toSorted())
  })

  it('tells platform admins about new applications', async () => {
    const { catalog, ids } = context
    const recipients = await catalog.EVENT_DEFINITIONS['organization.application_received'].inApp?.({
      actorId: null,
      data: {
        applicantEmail: 'applicant@example.org',
        applicantName: 'Applicant',
        city: 'Milan',
        country: 'IT',
        locale: 'it',
        message: null,
        organizationName: 'Test',
      },
      organizationId: null,
      type: 'organization.application_received',
    })

    expect(recipients).toContain(ids.admin)
  })

  it('writes in-app rows for everyone and skips optional mail for muted users', async () => {
    const { client, ids, notify, organizationId, schema } = context
    await client.db
      .update(schema.users)
      .set({ notificationPreferences: { reminders: false } })
      .where(eq(schema.users.id, ids.representative))

    const result = await notify.notify({
      actorId: null,
      data: { certificateId: -1, days: 8, holderId: ids.volunteer, tutorId: ids.tutor },
      organizationId,
      type: 'certificate.review_escalated',
    })

    const rows = await client.db.query.notifications.findMany({
      where: and(
        inArray(schema.notifications.userId, [ids.owner, ids.representative]),
        eq(schema.notifications.type, 'certificate.review_escalated')
      ),
    })

    expect(result.inApp).toBe(2)
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'reminders',
        template: expect.objectContaining({ name: 'certificate/reminder' }),
        to: seedEmail('owner'),
        unsubscribeUrl: expect.stringContaining('/api/v1/mail-preferences?token='),
      })
    )
    expect(rows.map(({ userId }) => userId).toSorted()).toEqual([ids.owner, ids.representative].toSorted())
    expect(rows.every(({ url }) => url === '/certificates/-1')).toBe(true)
    expect(rows.every(({ data }) => !('email' in data))).toBe(true)
  })

  it('gives the previous and the new owner their own ownership copy', async () => {
    const { client, ids, notify, organizationId, schema } = context
    const [before] = await client.db.select({ id: max(schema.notifications.id) }).from(schema.notifications)
    await notify.notify({
      actorId: ids.owner,
      data: { newOwnerId: ids.representative, previousOwnerId: ids.owner },
      organizationId,
      type: 'organization.ownership_transferred',
    })
    const where = and(
      inArray(schema.notifications.userId, [ids.owner, ids.representative]),
      eq(schema.notifications.type, 'organization.ownership_transferred'),
      gt(schema.notifications.id, before?.id ?? 0)
    )
    const rows = await client.db.query.notifications.findMany({ where })
    await client.db.delete(schema.notifications).where(where)

    const variants = Object.fromEntries(
      rows.map(({ data, userId }) => [userId, (data as { variant?: string }).variant])
    )
    expect(variants).toEqual({ [ids.owner]: 'left', [ids.representative]: 'gained' })
  })

  it('words an accepted invitation for a platform admin inviter', async () => {
    const { client, ids, notify, organizationId, schema } = context
    const [before] = await client.db.select({ id: max(schema.notifications.id) }).from(schema.notifications)
    for (const inviterId of [ids.admin, ids.owner]) {
      await notify.notify({
        actorId: ids.volunteer,
        data: { invitationId: -1, inviterId, userId: ids.volunteer },
        organizationId,
        type: 'invitation.accepted',
      })
    }
    const where = and(
      inArray(schema.notifications.userId, [ids.admin, ids.owner]),
      eq(schema.notifications.type, 'invitation.accepted'),
      gt(schema.notifications.id, before?.id ?? 0)
    )
    const rows = await client.db.query.notifications.findMany({ where })
    await client.db.delete(schema.notifications).where(where)

    const variants = Object.fromEntries(
      rows.map(({ data, userId }) => [userId, (data as { variant?: string }).variant])
    )
    expect(variants).toEqual({ [ids.admin]: 'platform', [ids.owner]: undefined })
  })

  it('records sent mail on the in-app row', async () => {
    const { client, ids, notify, organizationId, schema } = context
    const result = await notify.notify({
      actorId: ids.tutor,
      data: { certificateId: -1, comment: 'Add an example', holderId: ids.volunteer, tutorId: ids.tutor },
      organizationId,
      type: 'certificate.changes_requested',
    })
    const [row] = await client.db.query.notifications.findMany({
      where: and(
        eq(schema.notifications.userId, ids.volunteer),
        eq(schema.notifications.type, 'certificate.changes_requested')
      ),
    })
    await client.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, ids.volunteer),
          eq(schema.notifications.type, 'certificate.changes_requested')
        )
      )

    expect(result).toEqual({ emailed: 1, inApp: 1 })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({ name: 'certificate/review' }),
        to: seedEmail('volunteer'),
      })
    )
    expect(row?.emailedAt).not.toBeNull()
  })

  it('mails the holder when a manager revokes a certificate', async () => {
    const { client, ids, notify, organizationId, schema } = context
    const result = await notify.notify({
      actorId: ids.owner,
      data: { certificateId: -1, holderId: ids.volunteer, reason: 'Issued by mistake' },
      organizationId,
      type: 'certificate.revoked',
    })
    await client.db
      .delete(schema.notifications)
      .where(and(eq(schema.notifications.userId, ids.volunteer), eq(schema.notifications.type, 'certificate.revoked')))

    expect(result).toEqual({ emailed: 1, inApp: 1 })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({
          name: 'certificate/decision',
          props: expect.objectContaining({ kind: 'revoked', reason: 'Issued by mistake' }),
        }),
        to: seedEmail('volunteer'),
      })
    )
  })
})
