import 'server-only'

import { updateTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { type Transaction, db } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { saveTranslation } from '@/db/mutations/content-translation'
import { type ContentEntityType, type TranslationTarget, hasLocaleContent } from '@/db/queries/content-translation'
import { courses, docArticles, docCategories, lessons, skillGroups } from '@/db/schema'
import { CacheTag, courseTag } from '@/lib/cache'

export const entitySlug = async (entityType: ContentEntityType, entityId: number) => {
  if (entityType === 'course') {
    const row = await db.query.courses.findFirst({ columns: { slug: true }, where: eq(courses.id, entityId) })
    return row?.slug ?? null
  }
  if (entityType === 'lesson') {
    const [row] = await db
      .select({ slug: courses.slug })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(eq(lessons.id, entityId))
    return row?.slug ?? null
  }
  if (entityType === 'doc_article') {
    const row = await db.query.docArticles.findFirst({ columns: { slug: true }, where: eq(docArticles.id, entityId) })
    return row?.slug ?? null
  }
  if (entityType === 'doc_category') {
    const row = await db.query.docCategories.findFirst({
      columns: { slug: true },
      where: eq(docCategories.id, entityId),
    })
    return row?.slug ?? null
  }
  const row = await db.query.skillGroups.findFirst({ columns: { slug: true }, where: eq(skillGroups.id, entityId) })
  return row?.slug ?? null
}

export const markEdited = async (tx: Transaction, targets: TranslationTarget[], locale: string, userId: string) => {
  await mapSequential(
    targets.filter(target => hasLocaleContent(target, locale)),
    target => saveTranslation(tx, { locale, mode: 'edited', target, userId })
  )
}

export const expireTranslationCaches = (entityType: ContentEntityType, slug: string | null) => {
  updateTag(CacheTag.ContentTranslations)
  if (entityType === 'course' || entityType === 'lesson') {
    if (slug) updateTag(courseTag(slug))
    updateTag(CacheTag.Courses)
    return
  }
  if (entityType === 'skill_group') {
    updateTag(CacheTag.SkillGroups)
    updateTag(CacheTag.Courses)
    return
  }
  updateTag(CacheTag.DocCategories)
}
