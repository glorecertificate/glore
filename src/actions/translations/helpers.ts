import 'server-only'

import { type SQL, and, asc, eq, inArray } from 'drizzle-orm'

import { db } from '@/db/client'
import { sourceHashOf } from '@/db/mutations/content-translation'
import {
  type ContentEntityType,
  TARGET_LOCALES,
  type TargetTranslations,
  type TranslationTarget,
  articleTarget,
  categoryTarget,
  classifyTranslation,
  hasLocaleContent,
  lessonTarget,
  skillGroupTarget,
  targetField,
} from '@/db/queries/content-translation'
import {
  assessments,
  contentTranslations,
  courses,
  docArticles,
  docCategories,
  evaluations,
  lessons,
  questionOptions,
  questions,
  skillGroups,
} from '@/db/schema'

const lessonQuery = {
  columns: { content: true, id: true, title: true },
  orderBy: [asc(lessons.sortOrder), asc(lessons.id)] as SQL[],
  with: {
    assessments: { columns: { description: true, id: true }, orderBy: [asc(assessments.id)] as SQL[] },
    evaluations: { columns: { description: true, id: true }, orderBy: [asc(evaluations.id)] as SQL[] },
    questions: {
      columns: { description: true, explanation: true, id: true },
      orderBy: [asc(questions.id)] as SQL[],
      with: { options: { columns: { content: true, id: true }, orderBy: [asc(questionOptions.id)] as SQL[] } },
    },
  },
} as const

export const loadCourseTargets = async (courseId?: number): Promise<TranslationTarget[]> => {
  const rows = await db.query.courses.findMany({
    columns: { description: true, id: true, outcomes: true, title: true },
    orderBy: [asc(courses.id)] as SQL[],
    where: courseId === undefined ? undefined : eq(courses.id, courseId),
    with: { lessons: lessonQuery },
  })
  return rows.flatMap(row => [
    {
      entityId: row.id,
      entityType: 'course' as const,
      fields: [
        targetField('courses', row.id, 'title', row.title),
        targetField('courses', row.id, 'description', row.description),
        targetField('courses', row.id, 'outcomes', row.outcomes),
      ],
    },
    ...row.lessons.map(lessonTarget),
  ])
}

const loadLessonTarget = async (lessonId: number) => {
  const row = await db.query.lessons.findFirst({ ...lessonQuery, where: eq(lessons.id, lessonId) })
  return row ? lessonTarget(row) : null
}

const loadDocTargets = async (): Promise<TranslationTarget[]> => {
  const [articles, categories] = await Promise.all([
    db.query.docArticles.findMany({
      columns: { content: true, excerpt: true, id: true, title: true },
      orderBy: [asc(docArticles.id)] as SQL[],
    }),
    db.query.docCategories.findMany({
      columns: { description: true, id: true, title: true },
      orderBy: [asc(docCategories.id)] as SQL[],
    }),
  ])
  return [...articles.map(row => articleTarget(row)), ...categories.map(row => categoryTarget(row))]
}

const loadSkillGroupTargets = async (): Promise<TranslationTarget[]> => {
  const rows = await db.query.skillGroups.findMany({
    columns: { description: true, id: true, name: true },
    orderBy: [asc(skillGroups.id)] as SQL[],
  })
  return rows.map(skillGroupTarget)
}

export const loadAllTargets = async () => {
  const [courseTargets, docTargets, groupTargets] = await Promise.all([
    loadCourseTargets(),
    loadDocTargets(),
    loadSkillGroupTargets(),
  ])
  return [...courseTargets, ...docTargets, ...groupTargets]
}

export const loadTargets = async (entityType: ContentEntityType, entityId: number): Promise<TranslationTarget[]> => {
  if (entityType === 'course') return await loadCourseTargets(entityId)
  if (entityType === 'lesson') {
    const target = await loadLessonTarget(entityId)
    return target ? [target] : []
  }
  if (entityType === 'doc_article') {
    const row = await db.query.docArticles.findFirst({
      columns: { content: true, excerpt: true, id: true, title: true },
      where: eq(docArticles.id, entityId),
    })
    return row ? [articleTarget(row)] : []
  }
  if (entityType === 'doc_category') {
    const row = await db.query.docCategories.findFirst({
      columns: { description: true, id: true, title: true },
      where: eq(docCategories.id, entityId),
    })
    return row ? [categoryTarget(row)] : []
  }
  const row = await db.query.skillGroups.findFirst({
    columns: { description: true, id: true, name: true },
    where: eq(skillGroups.id, entityId),
  })
  return row ? [skillGroupTarget(row)] : []
}

const loadRows = async (targets: TranslationTarget[]) => {
  const idsByType = Map.groupBy(targets, target => target.entityType)
  const found = await Promise.all(
    [...idsByType].map(([entityType, group]) =>
      db
        .select()
        .from(contentTranslations)
        .where(
          and(
            eq(contentTranslations.entityType, entityType),
            inArray(
              contentTranslations.entityId,
              group.map(target => target.entityId)
            )
          )
        )
    )
  )
  return new Map(found.flat().map(row => [`${row.entityType}:${row.entityId}:${row.locale}`, row]))
}

export const describeTargets = async (targets: TranslationTarget[]): Promise<TargetTranslations[]> => {
  const rows = await loadRows(targets)
  return targets.map(target => {
    const hash = sourceHashOf(target)
    return {
      entityId: target.entityId,
      entityType: target.entityType,
      locales: TARGET_LOCALES.map(locale => {
        const hasContent = hasLocaleContent(target, locale)
        const row = rows.get(`${target.entityType}:${target.entityId}:${locale}`)
        return { hasContent, locale, state: classifyTranslation(hasContent, row, hash) }
      }),
    }
  })
}
