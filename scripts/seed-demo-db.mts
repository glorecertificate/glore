import { randomBytes } from 'node:crypto'

import { type PoolClient } from 'pg'

import { type MembershipRole } from './seed-data.ts'
import { APPLICATION_MOTIVATION, ORGANIZATION_DESCRIPTIONS } from './seed-demo-copy.ts'
import { APPLICANT, DAY_MS, DEMO_ORGANIZATIONS, DEMO_USERS, ago, demoEmail } from './seed-demo-data.ts'
import {
  DEMO_INVITATIONS,
  DEMO_INVITE_LINK,
  DEMO_JOIN_REQUESTS,
  type DemoCourseProgress,
  type DemoEvent,
  EDITOR_COURSES,
  INVITATION_EXPIRY_DAYS,
  type PlannedCertificate,
  type PlannedNotification,
  SKILL_COMPASS,
  buildSnapshot,
  courseRatingComment,
  eventMetadata,
  eventSubject,
  notificationUrl,
  resolveEventData,
} from './seed-demo-story.ts'

interface Context {
  client: PoolClient
  now: Date
  testEmail: string
}

export interface DemoIds {
  organizations: Map<string, number>
  users: Map<string, string>
}

const token = () => randomBytes(32).toString('base64url')

const userId = (ids: DemoIds, key: string) => {
  const id = ids.users.get(key)
  if (!id) throw new Error(`Unknown demo user ${key}`)
  return id
}

const organizationId = (ids: DemoIds, key: string) => {
  const id = ids.organizations.get(key)
  if (!id) throw new Error(`Unknown demo organization ${key}`)
  return id
}

export const upsertDemoOrganizations = async ({ client, now, testEmail }: Context) => {
  const ids = new Map<string, number>()
  for (const organization of DEMO_ORGANIZATIONS) {
    const createdAt = ago(now, organization.createdDaysAgo)
    const approvedAt = organization.approved ? ago(now, organization.createdDaysAgo - 2) : null
    const email = demoEmail(testEmail, `org-${organization.key}`)
    const { rows } = await client.query<{ id: number }>(
      `insert into organizations (handle, name, email, city, approved_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $6)
       on conflict (handle) do update set
         name = excluded.name, email = excluded.email, city = excluded.city, approved_at = excluded.approved_at,
         created_at = excluded.created_at, updated_at = excluded.updated_at
       returning id`,
      [organization.handle, organization.name, email, organization.city, approvedAt, createdAt]
    )
    const [{ id }] = rows
    ids.set(organization.key, id)

    const owner = DEMO_USERS.find(({ memberships }) => memberships[organization.key] === 'admin')
    const contactName = owner ? `${owner.firstName} ${owner.lastName}` : `${APPLICANT.firstName} ${APPLICANT.lastName}`
    const description = ORGANIZATION_DESCRIPTIONS[organization.key]
    await client.query(
      `insert into organization_profiles (
         organization_id, country, region, postcode, address, phone, url, description, avatar_url, signature_url,
         legal_name, registry_id, legal_representative, contact_name, contact_email, volunteers_per_year, motivation,
         charter_accepted_at, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, null, null, $9, $10, $11, $12, $13, $14, $15, $16, $16, $16)
       on conflict (organization_id) do update set
         country = excluded.country, region = excluded.region, postcode = excluded.postcode, address = excluded.address,
         phone = excluded.phone, url = excluded.url, description = excluded.description, avatar_url = null,
         signature_url = null, legal_name = excluded.legal_name, registry_id = excluded.registry_id,
         legal_representative = excluded.legal_representative, contact_name = excluded.contact_name,
         contact_email = excluded.contact_email, volunteers_per_year = excluded.volunteers_per_year,
         motivation = excluded.motivation, charter_accepted_at = excluded.charter_accepted_at,
         created_at = excluded.created_at, updated_at = excluded.updated_at`,
      [
        id,
        organization.country,
        organization.region,
        organization.postcode,
        organization.address,
        organization.phone,
        organization.url,
        JSON.stringify(description ?? null),
        organization.legalName,
        organization.registryId,
        organization.legalRepresentative,
        contactName,
        email,
        organization.volunteersPerYear,
        APPLICATION_MOTIVATION,
        createdAt,
      ]
    )
  }
  return ids
}

export const updateDemoProfiles = async ({ client, now }: Context, ids: DemoIds) => {
  for (const user of DEMO_USERS) {
    const { profile } = user
    await client.query(
      `update users set
         birthday = $2, birth_place = $3, nationality = $4, country = $5, city = $6, languages = $7::text[], bio = $8,
         public_profile = $9, banned = false, ban_reason = null, ban_expires = null, notification_preferences = '{}'::jsonb,
         created_at = $10, onboarded_at = $11, updated_at = $10
       where id = $1`,
      [
        userId(ids, user.key),
        profile.birthday,
        profile.birthPlace,
        profile.nationality,
        profile.country,
        profile.city,
        profile.languages,
        profile.bio ?? null,
        user.publicProfile ?? false,
        ago(now, user.joinedDaysAgo),
        ago(now, user.joinedDaysAgo - 1),
      ]
    )
  }
}

export const syncDemoMemberships = async ({ client, now }: Context, ids: DemoIds) => {
  const organizationIds = [...ids.organizations.values()]
  for (const user of DEMO_USERS) {
    for (const [key, organization] of ids.organizations) {
      const role: MembershipRole | undefined = user.memberships[key]
      const id = userId(ids, user.key)
      if (!role) {
        await client.query('delete from memberships where user_id = $1 and organization_id = $2', [id, organization])
        continue
      }
      await client.query(
        `insert into memberships (user_id, organization_id, role, created_at, updated_at)
         values ($1, $2, $3, $4, $4)
         on conflict (user_id, organization_id) do update set
           role = excluded.role, created_at = excluded.created_at, updated_at = excluded.updated_at`,
        [id, organization, role, ago(now, user.joinedDaysAgo)]
      )
    }
  }
  await client.query('delete from memberships where organization_id = any($1::int[]) and user_id <> all($2::text[])', [
    organizationIds,
    [...ids.users.values()],
  ])
}

export const upsertEditorCourses = async ({ client, now }: Context, ids: DemoIds) => {
  for (const [index, course] of EDITOR_COURSES.entries()) {
    const { rows: groups } = await client.query<{ id: number }>('select id from skill_groups where slug = $1', [
      course.group,
    ])
    const groupId = groups[0]?.id
    if (!groupId) throw new Error(`Skill group ${course.group} is missing. Run pnpm run content:import first.`)
    const createdAt = ago(now, course.createdDaysAgo)
    const { rows } = await client.query<{ id: number }>(
      `insert into courses (slug, type, title, icon, languages, duration_minutes, skill_group_id, creator_id, sort_order, archived_at, created_at, updated_at)
       values ($1, 'skill', $2::jsonb, $3, $4::text[], 20, $5, $6, $7, null, $8, $8)
       on conflict (slug) do update set
         title = excluded.title, icon = excluded.icon, languages = excluded.languages, skill_group_id = excluded.skill_group_id,
         creator_id = excluded.creator_id, sort_order = excluded.sort_order, archived_at = null,
         created_at = excluded.created_at, updated_at = excluded.updated_at
       returning id`,
      [
        course.slug,
        JSON.stringify(course.title),
        course.icon,
        course.languages,
        groupId,
        userId(ids, 'editor'),
        900 + index,
        createdAt,
      ]
    )
    const [{ id }] = rows
    await client.query('delete from lessons where course_id = $1', [id])
    for (const [position, title] of course.lessons.entries()) {
      await client.query(
        'insert into lessons (course_id, title, sort_order, created_at, updated_at) values ($1, $2::jsonb, $3, $4, $4)',
        [id, JSON.stringify({ en: title, es: '', it: '' }), position + 1, createdAt]
      )
    }
  }
}

export const wipeDemoScope = async ({ client }: Context, ids: DemoIds) => {
  const organizations = [...ids.organizations.values()]
  const users = [...ids.users.values()]
  const statements: [string, unknown[]][] = [
    ['delete from notifications where user_id = any($1::text[])', [users]],
    [
      'delete from activity_events where organization_id = any($1::int[]) or actor_id = any($2::text[])',
      [organizations, users],
    ],
    ['delete from organization_join_requests where organization_id = any($1::int[])', [organizations]],
    ['delete from organization_invitations where organization_id = any($1::int[])', [organizations]],
    ['delete from organization_invite_links where organization_id = any($1::int[])', [organizations]],
    [
      'delete from certificates where organization_id = any($1::int[]) or user_id = any($2::text[])',
      [organizations, users],
    ],
    ['delete from user_answers where user_id = any($1::text[])', [users]],
    ['delete from user_assessments where user_id = any($1::text[])', [users]],
    ['delete from user_evaluations where user_id = any($1::text[])', [users]],
    ['delete from user_lessons where user_id = any($1::text[])', [users]],
    ['delete from user_courses where user_id = any($1::text[])', [users]],
    ['delete from course_ratings where user_id = any($1::text[])', [users]],
    ['delete from user_skill_compass where user_id = any($1::text[])', [users]],
  ]
  for (const [text, values] of statements) await client.query(text, values)
}

export interface FlowIds {
  invitations: Map<string, number>
  inviteLinks: Map<string, number>
  joinRequests: Map<string, number>
}

export const insertDemoFlows = async ({ client, now, testEmail }: Context, ids: DemoIds): Promise<FlowIds> => {
  const flows: FlowIds = { invitations: new Map(), inviteLinks: new Map(), joinRequests: new Map() }

  for (const invitation of DEMO_INVITATIONS) {
    const accepted = invitation.acceptedDaysAgo !== null
    const invitee = ids.users.get(invitation.invitee)
    const email = demoEmail(testEmail, invitation.invitee)
    const sentAt = ago(now, invitation.sentDaysAgo)
    const { rows } = await client.query<{ id: number }>(
      `insert into organization_invitations (
         organization_id, email, role, token, invited_by_id, user_id, locale, message, expires_at, accepted_at, last_sent_at, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $11) returning id`,
      [
        organizationId(ids, invitation.organization),
        email,
        invitation.role,
        token(),
        userId(ids, invitation.invitedBy),
        accepted ? (invitee ?? null) : null,
        invitation.locale,
        invitation.message,
        ago(now, invitation.sentDaysAgo - INVITATION_EXPIRY_DAYS),
        accepted ? ago(now, invitation.acceptedDaysAgo ?? 0) : null,
        sentAt,
      ]
    )
    flows.invitations.set(invitation.key, rows[0].id)
  }

  const { rows: links } = await client.query<{ id: number }>(
    `insert into organization_invite_links (organization_id, role, token, requires_approval, max_uses, uses, expires_at, created_by_id, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) returning id`,
    [
      organizationId(ids, DEMO_INVITE_LINK.organization),
      DEMO_INVITE_LINK.role,
      token(),
      DEMO_INVITE_LINK.requiresApproval,
      DEMO_INVITE_LINK.maxUses,
      DEMO_INVITE_LINK.uses,
      new Date(now.getTime() + DEMO_INVITE_LINK.expiresInDays * DAY_MS).toISOString(),
      userId(ids, DEMO_INVITE_LINK.createdBy),
      ago(now, DEMO_INVITE_LINK.createdDaysAgo),
    ]
  )
  flows.inviteLinks.set(DEMO_INVITE_LINK.key, links[0].id)

  for (const request of DEMO_JOIN_REQUESTS) {
    const decided = request.reviewedDaysAgo !== null
    const reviewedAt = decided ? ago(now, request.reviewedDaysAgo ?? 0) : null
    const { rows } = await client.query<{ id: number }>(
      `insert into organization_join_requests (
         organization_id, email, first_name, last_name, role, locale, message, reviewer_comment, reviewed_by, user_id,
         invite_link_id, status, accepted_at, rejected_at, reviewed_at, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::organization_request_status, $13, $14, $15, $16, $16) returning id`,
      [
        organizationId(ids, request.organization),
        demoEmail(testEmail, request.email),
        request.firstName,
        request.lastName,
        request.role,
        request.locale,
        request.message,
        request.reviewerComment,
        decided ? userId(ids, 'owner') : null,
        request.user ? userId(ids, request.user) : null,
        request.viaLink ? flows.inviteLinks.get(DEMO_INVITE_LINK.key) : null,
        request.status,
        request.status === 'accepted' ? reviewedAt : null,
        request.status === 'rejected' ? reviewedAt : null,
        reviewedAt,
        ago(now, request.createdDaysAgo),
      ]
    )
    flows.joinRequests.set(request.key, rows[0].id)
  }

  const applicant = DEMO_ORGANIZATIONS.find(({ approved }) => !approved)
  if (applicant) {
    await client.query(
      `insert into organization_join_requests (organization_id, email, first_name, last_name, role, locale, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'admin', $5, 'pending', $6, $6)`,
      [
        organizationId(ids, applicant.key),
        demoEmail(testEmail, 'applicant'),
        APPLICANT.firstName,
        APPLICANT.lastName,
        APPLICANT.locale,
        ago(now, applicant.createdDaysAgo),
      ]
    )
  }

  return flows
}

export interface CatalogCourse {
  icon: string | null
  id: number
  slug: string
  title: Record<string, string> | null
  type: string
}

export const loadCatalog = async ({ client }: Context, slugs: string[]) => {
  const { rows } = await client.query<CatalogCourse>(
    'select id, slug, title, icon, type from courses where slug = any($1::text[])',
    [slugs]
  )
  const catalog = new Map(rows.map(row => [row.slug, row]))
  const missing = slugs.filter(slug => !catalog.has(slug))
  if (missing.length > 0) {
    throw new Error(`Courses missing from the catalog: ${missing.join(', ')}. Run pnpm run content:import first.`)
  }
  return catalog
}

interface CertificateInput {
  catalog: Map<string, CatalogCourse>
  certificates: PlannedCertificate[]
}

export const insertDemoCertificates = async (
  { client }: Context,
  ids: DemoIds,
  { catalog, certificates }: CertificateInput
) => {
  const certificateIds = new Map<string, number>()

  for (const certificate of certificates) {
    const holder = DEMO_USERS.find(({ key }) => key === certificate.holder)
    const organization = DEMO_ORGANIZATIONS.find(({ key }) => key === certificate.organization)
    const orgId = organizationId(ids, certificate.organization)
    const issued = certificate.issuedAt !== null && certificate.holderDeletedAt === null
    const snapshot =
      issued && holder && organization
        ? buildSnapshot({
            certificate,
            courses: catalog,
            holder: {
              birthPlace: holder.profile.birthPlace,
              birthday: holder.profile.birthday,
              firstName: holder.firstName,
              lastName: holder.lastName,
              nationality: holder.profile.nationality,
            },
            organization: {
              id: orgId,
              legalRepresentative: organization.legalRepresentative,
              name: organization.name,
            },
          })
        : null
    const latest = [
      certificate.createdAt,
      certificate.submittedAt,
      certificate.reviewedAt,
      certificate.withdrawnAt,
      certificate.revokedAt,
    ]
      .flatMap(value => (value ? [value] : []))
      .toSorted()
      .at(-1)

    const { rows } = await client.query<{ id: number }>(
      `insert into certificates (
         handle, code, user_id, holder_deleted_at, organization_id, language, activity_start_date, activity_end_date,
         activity_duration, activity_location, activity_description, tasks, reviewer_id, reviewer_comment, status,
         is_default, snapshot, submitted_at, reviewed_at, rejected_reason, revoked_at, revoked_by_id, revoked_reason,
         withdrawn_at, issued_at, created_at, updated_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text[], $13, $14, $15::certificate_status, $16, $17::jsonb,
         $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
       ) returning id`,
      [
        certificate.handle,
        certificate.code,
        certificate.holder && holder ? userId(ids, certificate.holder) : null,
        certificate.holderDeletedAt,
        orgId,
        certificate.language,
        certificate.activity.startDate,
        certificate.activity.endDate,
        certificate.activity.duration,
        certificate.activity.location,
        certificate.activity.description,
        certificate.activity.tasks,
        certificate.reviewer ? userId(ids, certificate.reviewer) : null,
        certificate.reviewerComment,
        certificate.status,
        certificate.isDefault,
        snapshot ? JSON.stringify(snapshot) : null,
        certificate.submittedAt,
        certificate.reviewedAt,
        certificate.rejectedReason,
        certificate.revokedAt,
        certificate.revokedBy ? userId(ids, certificate.revokedBy) : null,
        certificate.revokedReason,
        certificate.withdrawnAt,
        certificate.issuedAt,
        certificate.createdAt,
        latest ?? certificate.createdAt,
      ]
    )
    const [{ id }] = rows
    certificateIds.set(certificate.key, id)

    for (const skill of certificate.skills) {
      const course = catalog.get(skill.course)
      if (!course) throw new Error(`Course ${skill.course} is not in the catalog`)
      await client.query(
        `insert into certificate_skills (certificate_id, course_id, self_level, level, evidence, statement, sort_order, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          id,
          course.id,
          skill.selfLevel,
          skill.level,
          skill.evidence,
          skill.statement,
          skill.sortOrder,
          certificate.createdAt,
        ]
      )
    }

    for (const review of certificate.reviews) {
      const [engagement, evidence, reflection, growth] = review.scores ?? []
      await client.query(
        `insert into certificate_reviews (
           certificate_id, reviewer_id, decision, comment, section_comments, score_engagement, score_evidence,
           score_reflection, score_growth, created_at
         ) values ($1, $2, $3::certificate_review_decision, $4, $5::jsonb, $6, $7, $8, $9, $10)`,
        [
          id,
          userId(ids, review.reviewer),
          review.decision,
          review.comment,
          JSON.stringify(review.sections),
          engagement ?? null,
          evidence ?? null,
          reflection ?? null,
          growth ?? null,
          review.at,
        ]
      )
    }

    if (certificate.rating) {
      await client.query(
        `insert into organization_ratings (
           certificate_id, organization_id, experience, support, certification_support, would_recommend, comment, created_at, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          id,
          orgId,
          certificate.rating.experience,
          certificate.rating.support,
          certificate.rating.certification,
          certificate.rating.recommend,
          certificate.rating.comment,
          certificate.submittedAt ?? certificate.createdAt,
        ]
      )
    }
  }

  return certificateIds
}

interface LessonTree {
  answers: { correct: number; wrong: number | null }[]
  assessments: number[]
  evaluations: number[]
  id: number
  sortOrder: number
}

const loadTrees = async ({ client }: Context, courseIds: number[]) => {
  const lessons = await client.query<{ course_id: number; id: number; sort_order: number }>(
    'select id, course_id, sort_order from lessons where course_id = any($1::int[]) order by sort_order',
    [courseIds]
  )
  const questions = await client.query<{
    is_correct: boolean
    lesson_id: number
    option_id: number
    question_id: number
  }>(
    `select q.lesson_id, q.id as question_id, o.id as option_id, o.is_correct
       from questions q join question_options o on o.question_id = q.id
       join lessons l on l.id = q.lesson_id
       where l.course_id = any($1::int[]) order by q.id, o.id`,
    [courseIds]
  )
  const evaluations = await client.query<{ id: number; lesson_id: number }>(
    'select e.id, e.lesson_id from evaluations e join lessons l on l.id = e.lesson_id where l.course_id = any($1::int[]) order by e.id',
    [courseIds]
  )
  const assessments = await client.query<{ id: number; lesson_id: number }>(
    'select a.id, a.lesson_id from assessments a join lessons l on l.id = a.lesson_id where l.course_id = any($1::int[]) order by a.id',
    [courseIds]
  )

  const trees = new Map<number, LessonTree[]>()
  const byLesson = new Map<number, LessonTree>()
  for (const row of lessons.rows) {
    const tree: LessonTree = { answers: [], assessments: [], evaluations: [], id: row.id, sortOrder: row.sort_order }
    byLesson.set(row.id, tree)
    trees.set(row.course_id, [...(trees.get(row.course_id) ?? []), tree])
  }
  const perQuestion = new Map<number, { correct: number; lessonId: number; wrong: number | null }>()
  for (const row of questions.rows) {
    const current = perQuestion.get(row.question_id) ?? { correct: 0, lessonId: row.lesson_id, wrong: null }
    if (row.is_correct) current.correct = row.option_id
    if (!row.is_correct && current.wrong === null) current.wrong = row.option_id
    perQuestion.set(row.question_id, current)
  }
  for (const { correct, lessonId, wrong } of perQuestion.values()) {
    byLesson.get(lessonId)?.answers.push({ correct, wrong })
  }
  for (const row of evaluations.rows) byLesson.get(row.lesson_id)?.evaluations.push(row.id)
  for (const row of assessments.rows) byLesson.get(row.lesson_id)?.assessments.push(row.id)
  return trees
}

const clamp = (value: number) => Math.min(5, Math.max(1, value))

interface ProgressInput {
  catalog: Map<string, CatalogCourse>
  progress: DemoCourseProgress[]
}

export const insertDemoProgress = async (context: Context, ids: DemoIds, { catalog, progress }: ProgressInput) => {
  const { client, now } = context
  const trees = await loadTrees(context, [...new Set([...catalog.values()].map(({ id }) => id))])

  const lessonRows: [string, number, string][] = []
  const answerRows: [string, number, string][] = []
  const evaluationRows: [string, number, number, string][] = []
  const assessmentRows: [string, number, number, string, string][] = []
  const courseRows: [string, number, string, number | null, string | null, string][] = []
  const ratingRows: [string, number, number, string | null, string][] = []

  for (const entry of progress) {
    const course = catalog.get(entry.course)
    const lessons = course ? (trees.get(course.id) ?? []) : []
    const user = DEMO_USERS.find(({ key }) => key === entry.user)
    if (!course || !user) throw new Error(`Cannot plan progress for ${entry.user} in ${entry.course}`)
    const id = userId(ids, entry.user)
    const total = lessons.length
    const done = entry.lessons === 'all' ? total : Math.min(entry.lessons, total)
    const stamp = (position: number) => ago(now, entry.activityDaysAgo + (done - 1 - position) * 0.3)

    for (const [position, lesson] of lessons.slice(0, done).entries()) {
      const at = stamp(position)
      lessonRows.push([id, lesson.id, at])
      for (const [index, answer] of lesson.answers.entries()) {
        if (answer.wrong !== null && index % 3 === 0 && entry.selfLevel < 4) answerRows.push([id, answer.wrong, at])
        answerRows.push([id, answer.correct, at])
      }
      for (const [index, evaluation] of lesson.evaluations.entries()) {
        evaluationRows.push([id, evaluation, clamp(entry.selfLevel + ((index + entry.selfLevel) % 3) - 1), at])
      }
      for (const assessment of lesson.assessments) {
        assessmentRows.push([id, assessment, clamp(entry.selfLevel), entry.reflection, at])
      }
    }

    const next = lessons[done]
    const first = next?.answers[0]
    if (entry.partialQuiz && first) {
      const at = ago(now, entry.activityDaysAgo)
      answerRows.push([id, first.correct, at])
      const second = next.answers[1]
      if (second?.wrong) answerRows.push([id, second.wrong, at])
    }

    const completed = total > 0 && done === total
    const lastLesson = done > 0 ? (lessons[done - 1]?.id ?? null) : null
    courseRows.push([
      id,
      course.id,
      user.locale,
      lastLesson,
      completed ? ago(now, entry.activityDaysAgo) : null,
      ago(now, entry.activityDaysAgo + Math.max(done, 1) * 0.3 + 0.2),
    ])
    if (completed && entry.rating) {
      ratingRows.push([
        id,
        course.id,
        entry.rating,
        courseRatingComment(entry.user, entry.course),
        ago(now, entry.activityDaysAgo),
      ])
    }
  }

  const column = <T,>(rows: T[][], index: number) => rows.map(row => row[index])

  if (lessonRows.length > 0) {
    await client.query(
      `insert into user_lessons (user_id, lesson_id, created_at, updated_at)
       select u, l, t, t from unnest($1::text[], $2::int[], $3::timestamp[]) as x(u, l, t)`,
      [column(lessonRows, 0), column(lessonRows, 1), column(lessonRows, 2)]
    )
  }
  if (answerRows.length > 0) {
    await client.query(
      `insert into user_answers (user_id, option_id, created_at, updated_at)
       select u, o, t, t from unnest($1::text[], $2::int[], $3::timestamp[]) as x(u, o, t)
       on conflict do nothing`,
      [column(answerRows, 0), column(answerRows, 1), column(answerRows, 2)]
    )
  }
  if (evaluationRows.length > 0) {
    await client.query(
      `insert into user_evaluations (user_id, evaluation_id, value, created_at, updated_at)
       select u, e, v, t, t from unnest($1::text[], $2::int[], $3::int[], $4::timestamp[]) as x(u, e, v, t)`,
      [column(evaluationRows, 0), column(evaluationRows, 1), column(evaluationRows, 2), column(evaluationRows, 3)]
    )
  }
  if (assessmentRows.length > 0) {
    await client.query(
      `insert into user_assessments (user_id, assessment_id, value, reflection, created_at, updated_at)
       select u, a, v, r, t, t from unnest($1::text[], $2::int[], $3::int[], $4::text[], $5::timestamp[]) as x(u, a, v, r, t)`,
      [
        column(assessmentRows, 0),
        column(assessmentRows, 1),
        column(assessmentRows, 2),
        column(assessmentRows, 3),
        column(assessmentRows, 4),
      ]
    )
  }
  if (courseRows.length > 0) {
    await client.query(
      `insert into user_courses (user_id, course_id, locale, last_lesson_id, completed_at, created_at, updated_at)
       select u, c, lo, ll, ca, cr, coalesce(ca, cr)
       from unnest($1::text[], $2::int[], $3::text[], $4::int[], $5::timestamp[], $6::timestamp[]) as x(u, c, lo, ll, ca, cr)`,
      [
        column(courseRows, 0),
        column(courseRows, 1),
        column(courseRows, 2),
        column(courseRows, 3),
        column(courseRows, 4),
        column(courseRows, 5),
      ]
    )
  }
  for (const [user, course, rating, comment, at] of ratingRows) {
    await client.query(
      `insert into course_ratings (user_id, course_id, rating, comment, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $5)`,
      [user, course, rating, comment, at]
    )
  }

  for (const [user, compass] of Object.entries(SKILL_COMPASS)) {
    const id = userId(ids, user)
    const entries = [
      ...compass.strengths.map(slug => [slug, 'strength'] as const),
      ...compass.goals.map(slug => [slug, 'goal'] as const),
    ]
    for (const [slug, kind] of entries) {
      const course = catalog.get(slug)
      if (!course) throw new Error(`Course ${slug} is not in the catalog`)
      await client.query(
        'insert into user_skill_compass (user_id, course_id, kind, created_at) values ($1, $2, $3::skill_compass_kind, $4)',
        [id, course.id, kind, ago(now, 30)]
      )
    }
  }
}

export interface EventIds {
  certificates: Map<string, number>
  courses: Map<string, CatalogCourse>
  flows: FlowIds
}

const eventContext = (ids: DemoIds, refs: EventIds) => {
  const lookup = (map: Map<string, number>, key: string) => {
    const id = map.get(key)
    if (id === undefined) throw new Error(`Unknown reference ${key}`)
    return id
  }
  return {
    certificate: (key: string) => lookup(refs.certificates, key),
    course: (slug: string) => refs.courses.get(slug)?.id ?? 0,
    invitation: (key: string) => lookup(refs.flows.invitations, key),
    inviteLink: (key: string) => lookup(refs.flows.inviteLinks, key),
    joinRequest: (key: string) => lookup(refs.flows.joinRequests, key),
    user: (key: string) => userId(ids, key),
  }
}

interface EventInput {
  events: DemoEvent[]
  notifications: PlannedNotification[]
  refs: EventIds
}

export const insertDemoEvents = async (
  { client, now }: Context,
  ids: DemoIds,
  { events, notifications, refs }: EventInput
) => {
  const context = eventContext(ids, refs)
  const resolved = events.map(entry => {
    const data = resolveEventData(entry.data, context)
    const orgId = entry.organization ? organizationId(ids, entry.organization) : null
    return { ...entry, data, orgId, subject: eventSubject(entry.type, data, orgId) }
  })

  await client.query(
    `insert into activity_events (actor_id, organization_id, subject_type, subject_id, action, metadata, created_at)
     select a, o, st, si, ac, md::jsonb, ca
     from unnest($1::text[], $2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::timestamp[])
       with ordinality as x(a, o, st, si, ac, md, ca, n)
     order by n`,
    [
      resolved.map(entry => (entry.actor ? userId(ids, entry.actor) : null)),
      resolved.map(entry => entry.orgId),
      resolved.map(entry => entry.subject.type),
      resolved.map(entry => entry.subject.id),
      resolved.map(entry => entry.type),
      resolved.map(entry => JSON.stringify(eventMetadata(entry.data))),
      resolved.map(entry => entry.at),
    ]
  )

  const rows = notifications.map(({ event: source, read, user }) => {
    const data = resolveEventData(source.data, context)
    const readAt = new Date(Math.min(Date.parse(source.at) + 2 * 3_600_000, now.getTime())).toISOString()
    return {
      at: source.at,
      data: JSON.stringify(eventMetadata(data)),
      readAt: read ? readAt : null,
      type: source.type,
      url: notificationUrl(source.type, data),
      user: userId(ids, user),
    }
  })
  if (rows.length === 0) return
  await client.query(
    `insert into notifications (user_id, type, data, url, read_at, created_at)
     select u, ty, d::jsonb, ur, ra, ca
     from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::timestamp[], $6::timestamp[]) as x(u, ty, d, ur, ra, ca)`,
    [
      rows.map(row => row.user),
      rows.map(row => row.type),
      rows.map(row => row.data),
      rows.map(row => row.url),
      rows.map(row => row.readAt),
      rows.map(row => row.at),
    ]
  )
}
