'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { asc, count, eq, max } from 'drizzle-orm'
import { z } from 'zod'

import { requireEditor } from '@/actions/guards'
import { db, transaction } from '@/db/client'
import { renumberSkillGroups } from '@/db/mutations/skill-group'
import { type SkillGroupInput, skillGroupSchema, slugifyName } from '@/db/queries/course-editing'
import { courses, skillGroups } from '@/db/schema'
import { CacheTag, courseTag } from '@/lib/cache'
import { LOCALES } from '@/lib/i18n'

const failure = (code: string) => ({ error: { code, message: code } })

const guard = async () => {
  try {
    return await requireEditor()
  } catch {
    return null
  }
}

const refresh = () => {
  updateTag(CacheTag.SkillGroups)
  updateTag(CacheTag.Courses)
}

const toDescription = (description: SkillGroupInput['description']) =>
  LOCALES.some(locale => description[locale].length > 0) ? description : null

const uniqueSlug = async (name: string) => {
  const base = slugifyName(name) || 'group'
  const rows = await db.select({ slug: skillGroups.slug }).from(skillGroups)
  const taken = new Set(rows.map(({ slug }) => slug))
  let slug = base
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base}-${suffix}`
  return slug
}

export const saveSkillGroup = async (input: SkillGroupInput & { id?: number }) => {
  if (!(await guard())) return failure('FORBIDDEN')
  const parsed = skillGroupSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { description, icon, name } = parsed.data

  if (input.id) {
    const [updated] = await db
      .update(skillGroups)
      .set({ description: toDescription(description), icon, name })
      .where(eq(skillGroups.id, input.id))
      .returning({ id: skillGroups.id })
    if (!updated) return failure('NOT_FOUND')
    refresh()
    return { data: updated }
  }

  const [last] = await db.select({ value: max(skillGroups.sortOrder) }).from(skillGroups)
  const [created] = await db
    .insert(skillGroups)
    .values({
      description: toDescription(description),
      icon,
      name,
      slug: await uniqueSlug(name.en),
      sortOrder: (last?.value ?? 0) + 1,
    })
    .returning({ id: skillGroups.id })
  if (!created) return failure('CREATE_FAILED')
  refresh()
  return { data: created }
}

export const deleteSkillGroup = async (id: number) => {
  if (!(await guard())) return failure('FORBIDDEN')
  const [usage] = await db.select({ total: count() }).from(courses).where(eq(courses.skillGroupId, id))
  if (usage && usage.total > 0) return failure('IN_USE')
  const [deleted] = await db.delete(skillGroups).where(eq(skillGroups.id, id)).returning({ id: skillGroups.id })
  if (!deleted) return failure('NOT_FOUND')
  refresh()
  return { data: deleted }
}

const moveSchema = z.object({ direction: z.enum(['down', 'up']), id: z.number().int().positive() })

export const moveSkillGroup = async (input: z.input<typeof moveSchema>) => {
  if (!(await guard())) return failure('FORBIDDEN')
  const parsed = moveSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')

  const rows = await db
    .select({ id: skillGroups.id })
    .from(skillGroups)
    .orderBy(asc(skillGroups.sortOrder), asc(skillGroups.id))
  const ids = rows.map(({ id }) => id)
  const from = ids.indexOf(parsed.data.id)
  const to = parsed.data.direction === 'up' ? from - 1 : from + 1
  if (from === -1) return failure('NOT_FOUND')
  if (to < 0 || to >= ids.length) return { data: { moved: false } }

  const ordered = ids.toSpliced(from, 1).toSpliced(to, 0, parsed.data.id)
  await transaction(tx => renumberSkillGroups(tx, ordered))
  refresh()
  return { data: { moved: true } }
}

const assignSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive().nullable(),
})

export const assignSkillGroup = async (input: z.input<typeof assignSchema>) => {
  if (!(await guard())) return failure('FORBIDDEN')
  const parsed = assignSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { courseId, groupId } = parsed.data

  const [course, group] = await Promise.all([
    db.query.courses.findFirst({ columns: { slug: true, type: true }, where: eq(courses.id, courseId) }),
    groupId
      ? db.query.skillGroups.findFirst({ columns: { id: true }, where: eq(skillGroups.id, groupId) })
      : Promise.resolve({ id: null }),
  ])
  if (!course || course.type !== 'skill') return failure('NOT_FOUND')
  if (!group) return failure('NOT_FOUND')

  await db.update(courses).set({ skillGroupId: groupId }).where(eq(courses.id, courseId))
  updateTag(courseTag(course.slug))
  refresh()
  return { data: { courseId } }
}
