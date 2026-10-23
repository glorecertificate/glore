import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { asc, avg, count, gte, sql } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import {
  type EditorCourseRow,
  type EditorSummary,
  buildContentHealth,
  summarizeEditorStats,
  toEngagementSeries,
  topCourses,
} from '@/actions/dashboard/core'
import { db } from '@/db/client'
import { pickLocale } from '@/db/queries/learning'
import { lastMonths } from '@/db/queries/organization-insights'
import { courseRatings, courses, userCourses } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

const monthOf = (column: typeof userCourses.createdAt | typeof userCourses.completedAt) =>
  sql<string>`to_char(date_trunc('month', ${column}), 'YYYY-MM')`

const queryEditorSummary = async (language: Locale): Promise<Omit<EditorSummary, 'pending'>> => {
  const months = lastMonths(new Date(), 6)
  const since = `${months[0]}-01`

  const [rows, enrollmentRows, ratingRows, started, completed] = await Promise.all([
    db.query.courses.findMany({
      columns: {
        archivedAt: true,
        icon: true,
        id: true,
        languages: true,
        skillGroupId: true,
        slug: true,
        title: true,
        type: true,
      },
      orderBy: [asc(courses.sortOrder), asc(courses.id)],
      with: { lessons: { columns: { id: true }, with: { assessments: { columns: { id: true }, limit: 1 } } } },
    }),
    db
      .select({ completions: count(userCourses.completedAt), courseId: userCourses.courseId, enrollments: count() })
      .from(userCourses)
      .groupBy(userCourses.courseId),
    db
      .select({ average: avg(courseRatings.rating), courseId: courseRatings.courseId, total: count() })
      .from(courseRatings)
      .groupBy(courseRatings.courseId),
    db
      .select({ month: monthOf(userCourses.createdAt), total: count() })
      .from(userCourses)
      .where(gte(userCourses.createdAt, since))
      .groupBy(monthOf(userCourses.createdAt)),
    db
      .select({ month: monthOf(userCourses.completedAt), total: count() })
      .from(userCourses)
      .where(gte(userCourses.completedAt, since))
      .groupBy(monthOf(userCourses.completedAt)),
  ])

  const enrollmentBy = new Map(enrollmentRows.map(row => [row.courseId, row]))
  const ratingBy = new Map(ratingRows.map(row => [row.courseId, row]))

  const editorRows = rows.map((row): EditorCourseRow => ({
    archived: row.archivedAt !== null,
    completions: enrollmentBy.get(row.id)?.completions ?? 0,
    enrollments: enrollmentBy.get(row.id)?.enrollments ?? 0,
    hasAssessment: row.lessons.some(lesson => lesson.assessments.length > 0),
    icon: row.icon,
    id: row.id,
    languages: row.languages,
    lessonCount: row.lessons.length,
    ratingAverage: ratingBy.get(row.id)?.average ? Number(ratingBy.get(row.id)?.average) : null,
    ratingCount: ratingBy.get(row.id)?.total ?? 0,
    skillGroupId: row.skillGroupId,
    slug: row.slug,
    title: pickLocale(row.title, language) ?? row.slug,
    type: row.type ?? 'intro',
  }))

  return {
    engagement: toEngagementSeries(
      months,
      started.filter(({ month }) => month),
      completed.filter(({ month }) => month)
    ),
    health: buildContentHealth(editorRows),
    stats: summarizeEditorStats(editorRows),
    top: topCourses(editorRows),
  }
}

const fetchEditorSummary = async (language: Locale) => {
  'use cache'
  cacheTag(CacheTag.Courses, CacheTag.Progress)
  cacheLife('minutes')

  return await queryEditorSummary(language)
}

export const loadEditorSummary = async (language: Locale, { cache = true }: { cache?: boolean } = {}) =>
  cache ? await fetchEditorSummary(language) : await queryEditorSummary(language)
