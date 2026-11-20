import { randomUUID } from 'node:crypto'

import { vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

export const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

type UserKey =
  | 'author'
  | 'foreignTutor'
  | 'learner'
  | 'manager'
  | 'otherAuthor'
  | 'outsider'
  | 'owner'
  | 'platformAdmin'
  | 'tutorA'
  | 'tutorB'
  | 'tutorC'

const MEMBERS = [
  ['author', 'volunteer'],
  ['otherAuthor', 'volunteer'],
  ['learner', 'learner'],
  ['tutorA', 'tutor'],
  ['tutorB', 'tutor'],
  ['tutorC', 'tutor'],
  ['manager', 'representative'],
  ['owner', 'admin'],
] as const

const USER_KEYS: UserKey[] = [...MEMBERS.map(([key]) => key), 'foreignTutor', 'outsider', 'platformAdmin']

interface CourseStub {
  completed: boolean
  id: number
  type: 'skill'
}

export const session = {
  authUser: null as { id: string; role: string | null } | null,
  courses: [] as CourseStub[],
  organizationId: null as number | null,
  rateLimited: false,
}

export const stubCourses = (courseIds: number[]): CourseStub[] =>
  courseIds.map(id => ({ completed: true, id, type: 'skill' }))

export const notifyMock = vi.fn((_event: unknown) => Promise.resolve({ emailed: 0, inApp: 0 }))
export const putMock = vi.fn((key: string, _body: unknown, _type: string) => Promise.resolve(`https://r2.test/${key}`))
export const deleteMock = vi.fn((_key: string) => Promise.resolve())

export const mocks = {
  auth: { getAuthUser: () => Promise.resolve(session.authUser) },
  cache: { cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() },
  courses: { listCourses: () => Promise.resolve({ data: session.courses, error: null }) },
  impersonation: { assertNotImpersonating: () => Promise.resolve(), impersonationLocked: () => Promise.resolve(null) },
  notify: { notify: notifyMock },
  rateLimit: {
    checkRateLimit: () => Promise.resolve({ limited: false, remaining: 100 }),
    clientAddress: () => Promise.resolve('127.0.0.1'),
    isRateLimited: () => Promise.resolve(session.rateLimited),
  },
  storage: { r2DeleteQuietly: deleteMock, r2Put: putMock },
  user: {
    getActiveOrgId: () => Promise.resolve(session.organizationId),
    getCurrentUser: async () => {
      const [{ db }, { eq }, { memberships }] = await Promise.all([
        import('@/db/client'),
        import('drizzle-orm'),
        import('@/db/schema'),
      ])
      const { authUser } = session
      if (!authUser) throw new Error('Not authenticated')
      const rows = await db
        .select({ id: memberships.organizationId, role: memberships.role })
        .from(memberships)
        .where(eq(memberships.userId, authUser.id))
      return { id: authUser.id, isAdmin: authUser.role === 'admin', organizations: rows }
    },
  },
}

export const createFixture = async () => {
  const [{ db }, schema, { and, eq, inArray, like, lt, or, sql }] = await Promise.all([
    import('@/db/client'),
    import('@/db/schema'),
    import('drizzle-orm'),
  ])

  const sweepStaleFixtures = async () => {
    const stale = sql`now() - interval '1 hour'`
    const [staleOrganizations, staleUsers, staleCourses] = await Promise.all([
      db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(and(like(schema.organizations.handle, 'lane-a-%'), lt(schema.organizations.createdAt, stale))),
      db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(like(schema.users.id, 'lane-a-%'), lt(schema.users.createdAt, stale))),
      db
        .select({ id: schema.courses.id })
        .from(schema.courses)
        .where(and(like(schema.courses.slug, 'lane-a-%'), lt(schema.courses.createdAt, stale))),
    ])
    const orgIds = staleOrganizations.map(({ id }) => id)
    const userIds = staleUsers.map(({ id }) => id)
    const staleCourseIds = staleCourses.map(({ id }) => id)
    if (orgIds.length + userIds.length + staleCourseIds.length === 0) return

    const ownedCertificates = or(
      inArray(schema.certificates.organizationId, orgIds),
      inArray(schema.certificates.userId, userIds)
    )
    const certificateRows = await db
      .select({ id: schema.certificates.id })
      .from(schema.certificates)
      .where(ownedCertificates)
    await db.delete(schema.activityEvents).where(
      or(
        inArray(schema.activityEvents.organizationId, orgIds),
        inArray(
          schema.activityEvents.subjectId,
          certificateRows.map(({ id }) => String(id))
        )
      )
    )
    await db.delete(schema.certificates).where(ownedCertificates)
    await db.delete(schema.userAssessments).where(inArray(schema.userAssessments.userId, userIds))
    await db.delete(schema.organizations).where(inArray(schema.organizations.id, orgIds))
    const lessonRows = await db
      .select({ id: schema.lessons.id })
      .from(schema.lessons)
      .where(inArray(schema.lessons.courseId, staleCourseIds))
    await db.delete(schema.assessments).where(
      inArray(
        schema.assessments.lessonId,
        lessonRows.map(({ id }) => id)
      )
    )
    await db.delete(schema.lessons).where(inArray(schema.lessons.courseId, staleCourseIds))
    await db.delete(schema.courses).where(inArray(schema.courses.id, staleCourseIds))
    await db.delete(schema.users).where(inArray(schema.users.id, userIds))
  }

  await sweepStaleFixtures()

  const tag = randomUUID().slice(0, 8)
  const ids = Object.fromEntries(USER_KEYS.map(key => [key, `lane-a-${tag}-${key}`])) as Record<UserKey, string>

  const insertOrganization = async (suffix: string) => {
    const [row] = await db
      .insert(schema.organizations)
      .values({
        city: 'Milan',
        email: `org-${suffix}-${tag}@lane-a.test`,
        handle: `lane-a-${tag}-${suffix}`,
        name: `Org ${suffix}`,
      })
      .returning({ id: schema.organizations.id })
    if (!row) throw new Error('Failed to insert organization')
    return row.id
  }

  const [organizationId, otherOrganizationId] = await Promise.all([insertOrganization('a'), insertOrganization('b')])

  await db.insert(schema.users).values(
    USER_KEYS.map(key => ({
      birthPlace: 'Milan',
      birthday: '2000-01-01',
      email: `${key}-${tag}@lane-a.test`.toLowerCase(),
      firstName: key,
      id: ids[key],
      lastName: 'Tester',
      name: key,
      nationality: 'it',
      role: key === 'platformAdmin' ? 'admin' : 'user',
    }))
  )
  const baseMemberships = [
    ...MEMBERS.map(([key, role]) => ({ organizationId, role, userId: ids[key] })),
    { organizationId: otherOrganizationId, role: 'tutor' as const, userId: ids.foreignTutor },
  ]
  await db.insert(schema.memberships).values(baseMemberships)

  const courses = await db
    .insert(schema.courses)
    .values(
      [1, 2, 3, 4, 5].map(index => ({
        icon: 'users',
        slug: `lane-a-${tag}-skill-${index}`,
        title: { en: `Skill ${index}`, es: `Habilidad ${index}`, it: `Competenza ${index}` },
        type: 'skill' as const,
      }))
    )
    .returning({ id: schema.courses.id })
  const courseIds = courses.map(({ id }) => id).toSorted((a, b) => a - b)
  const lessonRows = await db
    .insert(schema.lessons)
    .values(courseIds.map(courseId => ({ courseId, sortOrder: 0, title: { en: 'Final', es: 'Final', it: 'Finale' } })))
    .returning({ id: schema.lessons.id })
  const assessmentRows = await db
    .insert(schema.assessments)
    .values(lessonRows.map(({ id }) => ({ lessonId: id })))
    .returning({ id: schema.assessments.id })
  const assessmentIds = assessmentRows.map(({ id }) => id)
  const seedDescriptions = async () => {
    await db
      .delete(schema.skillLevelDescriptions)
      .where(inArray(schema.skillLevelDescriptions.assessmentId, assessmentIds))
    await db.insert(schema.skillLevelDescriptions).values(
      assessmentIds.flatMap(assessmentId =>
        (['intermediate', 'good', 'advanced'] as const).map(level => ({
          assessmentId,
          description: { en: `en ${level}`, es: `es ${level}`, it: `it ${level}` },
          level,
        }))
      )
    )
  }
  await seedDescriptions()

  const assess = async (
    level: 'advanced' | 'good' | 'intermediate' = 'good',
    user: 'author' | 'otherAuthor' = 'author'
  ) => {
    await db.delete(schema.userAssessments).where(eq(schema.userAssessments.userId, ids[user]))
    await db.insert(schema.userAssessments).values(
      assessmentRows.map(({ id }) => ({
        assessmentId: id,
        reflection: 'A reflection written for the fixture, long enough to be valid.',
        userId: ids[user],
        value: level,
      }))
    )
  }

  const as = (key: UserKey | null) => {
    session.authUser = key ? { id: ids[key], role: key === 'platformAdmin' ? 'admin' : 'user' } : null
  }

  const insertCertificate = async ({
    code = null,
    organization = organizationId,
    reviewer = null,
    skills = courseIds.slice(0, 3),
    status,
    user = 'author',
    ...overrides
  }: {
    activityDuration?: number
    activityEndDate?: string
    activityStartDate?: string
    code?: string | null
    organization?: number
    reviewer?: UserKey | null
    skills?: number[]
    status: (typeof schema.certificates.$inferInsert)['status']
    tasks?: string[]
    user?: UserKey
  }) => {
    const [row] = await db
      .insert(schema.certificates)
      .values({
        activityDescription: 'Helped at the community centre every week',
        activityDuration: 120,
        activityEndDate: '2026-06-30',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-10',
        code,
        handle: `lane-a-${tag}-${randomUUID().slice(0, 8)}`,
        language: 'en',
        organizationId: organization,
        reviewerId: reviewer ? ids[reviewer] : null,
        status,
        submittedAt: status === 'draft' ? null : new Date().toISOString(),
        tasks: ['Welcomed new volunteers', 'Organized weekly activities'],
        userId: ids[user],
        ...overrides,
      })
      .returning()
    if (!row) throw new Error('Failed to insert certificate')
    if (skills.length > 0) {
      await db.insert(schema.certificateSkills).values(
        skills.map((courseId, index) => ({
          certificateId: row.id,
          courseId,
          evidence: 'Led the weekly welcome desk',
          selfLevel: 'good' as const,
          sortOrder: index,
        }))
      )
      await db
        .insert(schema.organizationRatings)
        .values({ certificateId: row.id, experience: 4, organizationId: organization })
    }
    return row
  }

  const reload = async (id: number) => {
    const row = await db.query.certificates.findFirst({
      where: eq(schema.certificates.id, id),
      with: {
        reviews: true,
        skills: { orderBy: [schema.certificateSkills.sortOrder, schema.certificateSkills.courseId] },
      },
    })
    if (!row) throw new Error('Certificate disappeared')
    return row
  }

  const eventsFor = async (certificateId: number) =>
    await db.query.activityEvents.findMany({
      where: eq(schema.activityEvents.subjectId, String(certificateId)),
      orderBy: schema.activityEvents.id,
    })

  const clearCertificates = async () => {
    const orgIds = [organizationId, otherOrganizationId]
    const rows = await db
      .select({ id: schema.certificates.id })
      .from(schema.certificates)
      .where(inArray(schema.certificates.organizationId, orgIds))
    await db.delete(schema.activityEvents).where(
      or(
        inArray(schema.activityEvents.organizationId, orgIds),
        inArray(
          schema.activityEvents.subjectId,
          rows.map(({ id }) => String(id))
        )
      )
    )
    await db.delete(schema.certificates).where(inArray(schema.certificates.organizationId, orgIds))
  }

  const reset = async () => {
    const orgIds = [organizationId, otherOrganizationId]
    await clearCertificates()
    await db.delete(schema.memberships).where(inArray(schema.memberships.organizationId, orgIds))
    await db.insert(schema.memberships).values(baseMemberships)
    await db
      .update(schema.users)
      .set({ banned: false, birthPlace: 'Milan', birthday: '2000-01-01', lastName: 'Tester', nationality: 'it' })
      .where(inArray(schema.users.id, Object.values(ids)))
    session.authUser = null
    session.courses = stubCourses(courseIds)
    await assess()
    await assess('good', 'otherAuthor')
    await seedDescriptions()
    session.organizationId = organizationId
    session.rateLimited = false
    notifyMock.mockClear()
    putMock.mockClear()
    putMock.mockImplementation((key: string) => Promise.resolve(`https://r2.test/${key}`))
    deleteMock.mockClear()
  }

  const cleanup = async () => {
    await clearCertificates()
    await db.delete(schema.userAssessments).where(inArray(schema.userAssessments.userId, [ids.author, ids.otherAuthor]))
    await db.delete(schema.organizations).where(inArray(schema.organizations.id, [organizationId, otherOrganizationId]))
    await db.delete(schema.assessments).where(
      inArray(
        schema.assessments.id,
        assessmentRows.map(({ id }) => id)
      )
    )
    await db.delete(schema.lessons).where(inArray(schema.lessons.courseId, courseIds))
    await db.delete(schema.courses).where(inArray(schema.courses.id, courseIds))
    await db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  }

  return {
    as,
    clearCertificates,
    cleanup,
    assessmentIds,
    assess,
    reset,
    courseIds,
    db,
    eventsFor,
    ids,
    insertCertificate,
    organizationId,
    otherOrganizationId,
    reload,
    schema,
  }
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>
