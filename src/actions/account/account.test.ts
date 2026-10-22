import { randomUUID } from 'node:crypto'

import { revalidateTag, updateTag } from 'next/cache'

import { and, eq, inArray, like } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { userTag } from '@/lib/cache'
import { LOCAL_DATABASE_REGEX, SEED_ORG_HANDLE } from '~/scripts/seed-data'

const authUser = vi.hoisted(() => ({ current: null as { id: string } | null }))
const notify = vi.hoisted(() => vi.fn((_event: unknown) => Promise.resolve({ emailed: 0, inApp: 0 })))
const removeObject = vi.hoisted(() => vi.fn((_key: string) => Promise.resolve()))

vi.mock('@/actions/auth', () => ({ getAuthUser: () => Promise.resolve(authUser.current) }))
vi.mock('@/actions/notifications/notify', () => ({ notify }))
vi.mock('@/lib/storage', () => ({ r2DeleteQuietly: removeObject }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const ids = { admin: `acct-admin-${suffix}`, other: `acct-other-${suffix}`, subject: `acct-subject-${suffix}` }
const handles = { certificate: `acct-cert-${suffix}`, organization: `acct-org-${suffix}` }

describe.skipIf(!isLocalDatabase)('account settings actions', () => {
  let context: {
    client: typeof import('@/db/client')
    deletion: typeof import('@/actions/account/deletion')
    exporter: typeof import('@/actions/account/export')
    preferences: typeof import('@/actions/account/preferences')
    schema: typeof import('@/db/schema')
    sessions: typeof import('@/actions/account/sessions')
    user: typeof import('@/actions/user')
    organizationId: number
    seedOrganizationId: number
  }

  const cleanup = async () => {
    const { client, schema } = context
    await client.db.delete(schema.certificates).where(like(schema.certificates.handle, `acct-cert-${suffix}%`))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.handle, handles.organization))
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.subjectId, ids.subject))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
    await client.db.delete(schema.rateLimits).where(like(schema.rateLimits.key, `%${suffix}%`))
  }

  beforeAll(async () => {
    const [client, deletion, exporter, preferences, schema, sessions, user] = await Promise.all([
      import('@/db/client'),
      import('@/actions/account/deletion'),
      import('@/actions/account/export'),
      import('@/actions/account/preferences'),
      import('@/db/schema'),
      import('@/actions/account/sessions'),
      import('@/actions/user'),
    ])
    const seed = await client.db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(schema.organizations.handle, SEED_ORG_HANDLE),
    })
    if (!seed) throw new Error('Run pnpm run db:seed first')
    context = {
      client,
      deletion,
      exporter,
      organizationId: 0,
      preferences,
      schema,
      seedOrganizationId: seed.id,
      sessions,
      user,
    }
    await cleanup()

    await client.db.insert(schema.users).values(
      Object.values(ids).map(id => ({
        email: `${id}@account.test`,
        firstName: 'Acct',
        id,
        name: 'Acct',
        username: id,
      }))
    )
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        city: 'Milan',
        email: `${handles.organization}@account.test`,
        handle: handles.organization,
        name: 'Acct Org',
      })
      .returning({ id: schema.organizations.id })
    context.organizationId = organization!.id
    await client.db.insert(schema.memberships).values([
      { organizationId: organization!.id, role: 'admin', userId: ids.subject },
      { organizationId: context.seedOrganizationId, role: 'volunteer', userId: ids.subject },
    ])
    await client.db.insert(schema.certificates).values(
      ['a', 'b'].map(key => ({
        activityDescription: 'Helped',
        activityDuration: 120,
        activityEndDate: '2026-02-01',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-01',
        handle: `${handles.certificate}-${key}`,
        issuedAt: new Date().toISOString(),
        language: 'en',
        organizationId: context.seedOrganizationId,
        status: 'approved' as const,
        userId: ids.subject,
      }))
    )
    const now = new Date().toISOString()
    const later = new Date(Date.now() + 86_400_000).toISOString()
    await client.db.insert(schema.sessions).values([
      {
        createdAt: now,
        expiresAt: later,
        id: `s1-${suffix}`,
        token: `t1-${suffix}`,
        updatedAt: now,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36',
        userId: ids.subject,
      },
      {
        createdAt: now,
        expiresAt: later,
        id: `s2-${suffix}`,
        token: `t2-${suffix}`,
        updatedAt: now,
        userId: ids.subject,
      },
      {
        createdAt: now,
        expiresAt: later,
        id: `s3-${suffix}`,
        token: `t3-${suffix}`,
        updatedAt: now,
        userId: ids.other,
      },
    ])
  })

  afterAll(async () => {
    await cleanup()
  })

  it('merges notification preferences without losing others', async () => {
    authUser.current = { id: ids.subject }
    const { client, preferences, schema } = context
    expect((await preferences.updateNotificationPreferences({ learning: false })).error).toBeNull()
    expect((await preferences.updateNotificationPreferences({ reminders: false })).error).toBeNull()

    const user = await client.db.query.users.findFirst({ where: eq(schema.users.id, ids.subject) })
    expect(user?.notificationPreferences).toEqual({ learning: false, reminders: false })
    expect((await preferences.updateNotificationPreferences({})).error?.code).toBe('INVALID_INPUT')
  })

  it('toggles the public profile and features one certificate at a time', async () => {
    authUser.current = { id: ids.subject }
    const { client, preferences, schema } = context
    expect((await preferences.updatePrivacy({ publicProfile: true })).error).toBeNull()
    expect((await client.db.query.users.findFirst({ where: eq(schema.users.id, ids.subject) }))?.publicProfile).toBe(
      true
    )

    const listed = await preferences.listFeaturableCertificates()
    expect(listed.data).toHaveLength(2)
    const [first, second] = listed.data!
    await preferences.updatePrivacy({ featuredCertificateId: first!.id })
    await preferences.updatePrivacy({ featuredCertificateId: second!.id })

    const rows = await client.db.query.certificates.findMany({
      columns: { id: true, isDefault: true },
      where: eq(schema.certificates.userId, ids.subject),
    })
    expect(rows.filter(({ isDefault }) => isDefault).map(({ id }) => id)).toEqual([second!.id])
  })

  it('expires the user cache at once so the caller reads its own settings', async () => {
    authUser.current = { id: ids.subject }
    const { preferences, user } = context
    vi.mocked(updateTag).mockClear()
    vi.mocked(revalidateTag).mockClear()

    await preferences.updateNotificationPreferences({ learning: true })
    await preferences.updatePrivacy({ publicProfile: false })
    await user.updateProfile({ city: 'Milan' })

    expect(vi.mocked(updateTag).mock.calls).toEqual([
      [userTag(ids.subject)],
      [userTag(ids.subject)],
      [userTag(ids.subject)],
    ])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('refuses to feature a certificate of another user', async () => {
    const { client, preferences, schema } = context
    const own = await client.db.query.certificates.findFirst({
      columns: { id: true },
      where: eq(schema.certificates.userId, ids.subject),
    })
    authUser.current = { id: ids.other }
    const result = await preferences.updatePrivacy({ featuredCertificateId: own!.id })
    expect(result.error).not.toBeNull()
  })

  it('lists only the own sessions and revokes them one by one', async () => {
    authUser.current = { id: ids.subject }
    const { client, schema, sessions } = context
    const listed = await sessions.listSessions()
    expect(listed.data?.map(({ id }) => id).toSorted()).toEqual([`s1-${suffix}`, `s2-${suffix}`])

    expect((await sessions.revokeSession(`s3-${suffix}`)).error?.code).toBe('NOT_FOUND')
    expect((await sessions.revokeSession(`s1-${suffix}`)).error).toBeNull()

    const left = await client.db.query.sessions.findMany({
      columns: { id: true },
      where: inArray(schema.sessions.userId, [ids.subject, ids.other]),
    })
    expect(left.map(({ id }) => id).toSorted()).toEqual([`s2-${suffix}`, `s3-${suffix}`])
  })

  it('lists at most 20 unexpired sessions, newest first, with the time Better Auth wrote', async () => {
    authUser.current = { id: ids.admin }
    const { client, schema, sessions } = context
    const written = (date: Date) => date as unknown as string
    const later = written(new Date(Date.now() + 86_400_000))
    const expired = written(new Date(Date.now() - 60_000))
    await client.db.insert(schema.sessions).values([
      ...Array.from({ length: 25 }, (_, index) => {
        const time = written(new Date(Date.now() - index * 60_000))
        return {
          createdAt: time,
          expiresAt: later,
          id: `bulk-${index}-${suffix}`,
          token: `bulk-${index}-${suffix}`,
          updatedAt: time,
          userId: ids.admin,
        }
      }),
      {
        createdAt: expired,
        expiresAt: expired,
        id: `old-${suffix}`,
        token: `old-${suffix}`,
        updatedAt: expired,
        userId: ids.admin,
      },
    ])
    const listed = await sessions.listSessions()
    expect(listed.data).toHaveLength(20)
    expect(listed.data?.[0]?.id).toBe(`bulk-0-${suffix}`)
    expect(listed.data?.map(({ id }) => id)).not.toContain(`old-${suffix}`)
    expect(Math.abs(Date.parse(listed.data![0]!.updatedAt) - Date.now())).toBeLessThan(5000)
    const times = listed.data!.map(({ updatedAt }) => updatedAt)
    expect(times).toEqual(times.toSorted().toReversed())
  })

  it('exports the account data without credentials', async () => {
    const { exporter } = context
    authUser.current = { id: ids.subject }
    const { data: exported, error } = await exporter.exportAccountData()
    expect(error).toBeNull()
    expect(exported).toMatchObject({
      account: { email: `${ids.subject}@account.test` },
      format: 'glore-account-export',
      version: 1,
    })
    expect(exported?.certificates).toHaveLength(2)
    expect(exported?.memberships.map(({ role }) => role).toSorted()).toEqual(['admin', 'volunteer'])
    expect(JSON.stringify(exported)).not.toMatch(/password|"token"|banReason/u)

    authUser.current = null
    expect((await exporter.exportAccountData()).error?.code).toBe('UNAUTHORIZED')
  })

  it('blocks deletion while the user is the sole administrator', async () => {
    const { client, deletion, schema } = context
    const user = { email: `${ids.subject}@account.test`, firstName: 'Acct', id: ids.subject, locale: null }

    expect(await deletion.soleAdminOrganizations(ids.subject)).toEqual([
      { id: context.organizationId, name: 'Acct Org' },
    ])
    const blocked = await deletion.eraseAccount(user)
    expect(blocked.deleted).toBe(false)
    expect(await client.db.query.users.findFirst({ where: eq(schema.users.id, ids.subject) })).toBeDefined()

    await client.db
      .insert(schema.memberships)
      .values({ organizationId: context.organizationId, role: 'admin', userId: ids.admin })
    expect(await deletion.soleAdminOrganizations(ids.subject)).toEqual([])
  })

  it('erases an account that owns certificates, keeps them anonymized, and records the event once', async () => {
    const { client, deletion, schema } = context
    const user = { email: `${ids.subject}@account.test`, firstName: 'Acct', id: ids.subject, locale: 'en' }

    expect((await deletion.eraseAccount(user)).deleted).toBe(true)

    expect(await client.db.query.users.findFirst({ where: eq(schema.users.id, ids.subject) })).toBeUndefined()
    const kept = await client.db.query.certificates.findMany({
      where: like(schema.certificates.handle, `${handles.certificate}%`),
    })
    expect(kept).toHaveLength(2)
    for (const certificate of kept) {
      expect(certificate).toMatchObject({ activityDescription: '', status: 'approved', userId: null })
      expect(certificate.holderDeletedAt).toBeTruthy()
    }
    expect(await client.db.query.memberships.findMany({ where: eq(schema.memberships.userId, ids.subject) })).toEqual(
      []
    )

    const events = await client.db.query.activityEvents.findMany({
      where: and(eq(schema.activityEvents.action, 'account.deleted'), eq(schema.activityEvents.subjectId, ids.subject)),
    })
    expect(events).toHaveLength(1)
    expect(events[0]?.actorId).toBeNull()
    expect(JSON.stringify(events[0]?.metadata)).not.toContain('@account.test')
    expect(notify).toHaveBeenCalledOnce()
  })
})
