import { randomUUID } from 'node:crypto'

import { type Page, expect } from '@playwright/test'
import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX, type MembershipRole, SEED_PASSWORD } from '~/scripts/seed-data'

import { clearRateLimits } from './db'
import { hydrated } from './helpers'

export interface TenantUser {
  email: string
  firstName: string
  id: string
  key: string
  lastName: string
}

export interface Tenant {
  handle: string
  id: number
  name: string
  tag: string
  users: Record<string, TenantUser>
}

interface TenantMember {
  completedSkills?: number
  key: string
  locale?: string
  role: MembershipRole | null
}

const connection = () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) {
    throw new Error('E2E tenants only run against the local database')
  }
  return connectionString
}

export const withDb = async <T>(run: (pool: Pool) => Promise<T>) => {
  const pool = new Pool({ connectionString: connection() })
  try {
    return await run(pool)
  } finally {
    await pool.end()
  }
}

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

export const createTenant = async (label: string, members: TenantMember[]): Promise<Tenant> => {
  const tag = `${label}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const passwordHash = await hashPassword(SEED_PASSWORD)
  return await withDb(async pool => {
    const organization = await pool.query<{ id: number }>(
      `insert into organizations (handle, name, email, city, approved_at)
       values ($1, $2, $3, 'Milan', now()) returning id`,
      [`g2-${tag}`, `G2 ${label} ${tag}`, `org-${tag}@g2.glore.test`]
    )
    const organizationId = organization.rows[0]?.id
    if (!organizationId) throw new Error('Organization insert failed')
    await pool.query(
      `insert into organization_profiles (organization_id, country, legal_name, registry_id, legal_representative)
       values ($1, 'IT', $2, $3, 'Giulia Rappresentante')`,
      [organizationId, `G2 ${label} APS`, `G2-${tag}`]
    )
    const skills = await pool.query<{ id: number }>(
      `select c.id from courses c
       where c.type = 'skill' and c.archived_at is null
         and exists (select 1 from lessons l join assessments a on a.lesson_id = l.id where l.course_id = c.id)
       order by c.id limit 4`
    )
    const users: Record<string, TenantUser> = {}
    for (const member of members) {
      const id = randomUUID()
      const firstName = capitalize(member.key.replaceAll(/[^a-z0-9]/gu, ''))
      const user = {
        email: `${member.key}-${tag}@g2.glore.test`,
        firstName,
        id,
        key: member.key,
        lastName: `Tester${tag.replaceAll('-', '')}`,
      }
      await pool.query(
        `insert into users (id, name, email, email_verified, username, first_name, last_name, birthday, birth_place,
           nationality, locale, onboarded_at, role)
         values ($1, $2, $3, true, $4, $5, $6, '1992-04-12', 'Milan, Italy', 'it', $7, now(), 'user')`,
        [
          id,
          `${firstName} ${user.lastName}`,
          user.email,
          `g2.${member.key}.${tag}`.toLowerCase(),
          firstName,
          user.lastName,
          member.locale ?? 'en',
        ]
      )
      await pool.query(
        `insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
         values ($1, $2, 'credential', $2, $3, now(), now())`,
        [randomUUID(), id, passwordHash]
      )
      if (member.role) {
        await pool.query('insert into memberships (user_id, organization_id, role) values ($1, $2, $3::role)', [
          id,
          organizationId,
          member.role,
        ])
      }
      for (const course of skills.rows.slice(0, member.completedSkills ?? 0)) {
        await pool.query(
          `insert into user_courses (user_id, course_id, locale, completed_at) values ($1, $2, 'en', now())`,
          [id, course.id]
        )
        await pool.query(
          'insert into user_lessons (user_id, lesson_id) select $1, id from lessons where course_id = $2',
          [id, course.id]
        )
        await pool.query(
          `insert into user_assessments (user_id, assessment_id, value, reflection)
           select $1, a.id, 4, 'A fixture reflection written for the end to end run, long enough to be valid.'
           from assessments a join lessons l on l.id = a.lesson_id where l.course_id = $2`,
          [id, course.id]
        )
      }
      users[member.key] = user
    }
    return { handle: `g2-${tag}`, id: organizationId, name: `G2 ${label} ${tag}`, tag, users }
  })
}

export const removeTenant = async (tenant: Tenant) => {
  const ids = Object.values(tenant.users).map(user => user.id)
  await withDb(async pool => {
    await pool.query('delete from certificates where organization_id = $1 or user_id = any($2)', [tenant.id, ids])
    await pool.query(
      'delete from activity_events where organization_id = $1 or actor_id = any($2) or subject_id = any($2)',
      [tenant.id, ids]
    )
    await pool.query('delete from user_answers where user_id = any($1)', [ids])
    await pool.query('delete from user_evaluations where user_id = any($1)', [ids])
    await pool.query('delete from user_assessments where user_id = any($1)', [ids])
    await pool.query('delete from user_lessons where user_id = any($1)', [ids])
    await pool.query('delete from user_courses where user_id = any($1)', [ids])
    await pool.query('delete from organization_join_requests where user_id = any($1)', [ids])
    await pool.query('delete from organization_invitations where organization_id = $1', [tenant.id])
    await pool.query('delete from organizations where id = $1', [tenant.id])
    await pool.query('delete from users where id = any($1)', [ids])
  })
}

export const tenantLogin = async (page: Page, user: TenantUser) => {
  await clearRateLimits()
  await page.goto('/login')
  const username = page.locator('input[name="username"]')
  await hydrated(username)
  await username.fill(user.email)
  await page.locator('input[name="password"]').fill(SEED_PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/u)
}

interface SeedRequest {
  author: TenantUser
  code?: string
  daysAgo?: number
  reviewer?: TenantUser
  status: 'approved' | 'changes_requested' | 'draft' | 'in_review' | 'rejected' | 'revoked' | 'submitted' | 'withdrawn'
  tenant: Tenant
}

export const seedRequest = async ({ author, code, daysAgo = 0, reviewer, status, tenant }: SeedRequest) =>
  await withDb(async pool => {
    const handle = `g2-${randomUUID()}`
    const issued = status === 'approved' || status === 'revoked'
    const certificate = await pool.query<{ id: number }>(
      `insert into certificates
        (handle, code, user_id, organization_id, language, activity_start_date, activity_end_date, activity_duration,
         activity_location, activity_description, tasks, reviewer_id, status, submitted_at, issued_at, is_default,
         revoked_at, revoked_reason, reviewer_comment)
       values ($1, $2, $3, $4, 'en', '2026-01-10', '2026-06-30', 120, 'Milan', 'G2 experience',
         array['Welcomed new volunteers'], $5, $6::certificate_status, $7, $8, $9, $10, $11, $12)
       returning id`,
      [
        handle,
        status === 'draft'
          ? null
          : (code ??
            `G2${Math.random().toString(36).slice(2, 4)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()),
        author.id,
        tenant.id,
        reviewer?.id ?? null,
        status,
        status === 'draft' ? null : new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
        issued ? new Date().toISOString() : null,
        status === 'approved',
        status === 'revoked' ? new Date().toISOString() : null,
        status === 'revoked' ? 'G2 revoked' : null,
        status === 'changes_requested' ? 'Please add more detail to the tasks.' : null,
      ]
    )
    const id = certificate.rows[0]?.id
    if (!id) throw new Error('Certificate insert failed')
    const courses = await pool.query<{ course_id: number }>(
      'select course_id from user_courses where user_id = $1 and completed_at is not null order by course_id limit 3',
      [author.id]
    )
    for (const [index, course] of courses.rows.entries()) {
      await pool.query(
        `insert into certificate_skills (certificate_id, course_id, level, self_level, sort_order, statement, evidence)
         values ($1, $2, 3, 3, $3, 'G2 statement', 'G2 evidence')`,
        [id, course.course_id, index]
      )
    }
    return { handle, id }
  })

export const certificateRow = async (id: number) =>
  await withDb(async pool => {
    const result = await pool.query<{
      code: string | null
      reviewer_id: string | null
      status: string
    }>('select code, reviewer_id, status from certificates where id = $1', [id])
    return result.rows[0]
  })

export const draftHours = async (userId: string) =>
  await withDb(async pool => {
    const result = await pool.query<{ activity_duration: number }>(
      "select activity_duration from certificates where user_id = $1 and status = 'draft' order by id desc limit 1",
      [userId]
    )
    return result.rows[0]?.activity_duration ?? 0
  })
