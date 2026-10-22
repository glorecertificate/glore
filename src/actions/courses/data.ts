import 'server-only'

import { and, asc, avg, count, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { db } from '@/db/client'
import { buildAnalytics } from '@/db/queries/course-editing'
import {
  type LessonDetailRow,
  type LessonStateRow,
  type OverviewRow,
  type RecommendationCandidate,
  type SkillOption,
  type SkillProgress,
  buildLearnerLesson,
  pickLocale,
} from '@/db/queries/learning'
import {
  activityEvents,
  assessments,
  courseRatings,
  courses,
  evaluations,
  lessons,
  questionOptions,
  questions,
  skillGroups,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
  userSkillCompass,
} from '@/db/schema'

export const findCourseOverview = async (slug: string, userId: string) => {
  const row = await db.query.courses.findFirst({
    columns: {
      archivedAt: true,
      description: true,
      durationMinutes: true,
      icon: true,
      id: true,
      languages: true,
      outcomes: true,
      slug: true,
      title: true,
      type: true,
    },
    where: eq(courses.slug, slug),
    with: {
      lessons: {
        columns: { id: true, sortOrder: true, title: true },
        orderBy: asc(lessons.sortOrder),
        with: {
          assessments: { columns: { id: true } },
          evaluations: { columns: { id: true } },
          questions: { columns: { id: true } },
          userLessons: { columns: { id: true }, where: eq(userLessons.userId, userId) },
        },
      },
      ratings: { columns: { rating: true } },
      skillGroup: { columns: { id: true, name: true, slug: true } },
      userCourses: { columns: { completedAt: true, locale: true }, where: eq(userCourses.userId, userId) },
    },
  })
  return row as OverviewRow | undefined
}

export const getSkillProgress = async (userId: string): Promise<SkillProgress> => {
  const counts = await db
    .select({ courseId: lessons.courseId, done: count(userLessons.id), total: count(lessons.id) })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .leftJoin(userLessons, and(eq(userLessons.lessonId, lessons.id), eq(userLessons.userId, userId)))
    .where(and(eq(courses.type, 'skill'), isNull(courses.archivedAt)))
    .groupBy(lessons.courseId)
  const completedCourseIds = counts.reduce<number[]>((ids, { courseId, done, total }) => {
    if (total > 0 && done === total) ids.push(courseId)
    return ids
  }, [])
  if (completedCourseIds.length === 0) return { averageRating: null, completedCourseIds }

  const [rating] = await db
    .select({ average: avg(userAssessments.value) })
    .from(userAssessments)
    .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
    .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
    .where(and(eq(userAssessments.userId, userId), inArray(lessons.courseId, completedCourseIds)))
  return { averageRating: rating?.average ? Number(rating.average) : null, completedCourseIds }
}

export const findLessonDetail = async (lessonId: number) => {
  const row = await db.query.lessons.findFirst({
    columns: { content: true, id: true, title: true },
    where: eq(lessons.id, lessonId),
    with: {
      assessments: { columns: { description: true, id: true }, orderBy: asc(assessments.id) },
      evaluations: { columns: { description: true, id: true }, orderBy: asc(evaluations.id) },
      questions: {
        columns: { description: true, explanation: true, id: true },
        orderBy: asc(questions.id),
        with: { options: { columns: { content: true, id: true }, orderBy: asc(questionOptions.id) } },
      },
    },
  })
  return row as LessonDetailRow | undefined
}

export const findLessonState = async (lessonId: number, userId: string): Promise<LessonStateRow> => {
  const [answers, ratings, assessment, completed] = await Promise.all([
    db
      .select({
        correct: questionOptions.isCorrect,
        optionId: userAnswers.optionId,
        questionId: questionOptions.questionId,
      })
      .from(userAnswers)
      .innerJoin(questionOptions, eq(questionOptions.id, userAnswers.optionId))
      .innerJoin(questions, eq(questions.id, questionOptions.questionId))
      .where(and(eq(userAnswers.userId, userId), eq(questions.lessonId, lessonId))),
    db
      .select({ evaluationId: userEvaluations.evaluationId, value: userEvaluations.value })
      .from(userEvaluations)
      .innerJoin(evaluations, eq(evaluations.id, userEvaluations.evaluationId))
      .where(and(eq(userEvaluations.userId, userId), eq(evaluations.lessonId, lessonId))),
    db
      .select({ reflection: userAssessments.reflection, value: userAssessments.value })
      .from(userAssessments)
      .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
      .where(and(eq(userAssessments.userId, userId), eq(assessments.lessonId, lessonId)))
      .limit(1),
    db
      .select({ id: userLessons.id })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId)))
      .limit(1),
  ])
  return { answers, assessment: assessment[0] ?? null, completed: completed.length > 0, ratings }
}

export const loadLearnerLesson = async (lessonId: number, userId: string, language: Locale) => {
  const [detail, state] = await Promise.all([findLessonDetail(lessonId), findLessonState(lessonId, userId)])
  return detail ? buildLearnerLesson(detail, state, language) : null
}

export const findOptionGrade = async (questionId: number, optionId: number) => {
  const [row] = await db
    .select({
      correct: questionOptions.isCorrect,
      explanation: questions.explanation,
      lessonId: questions.lessonId,
    })
    .from(questionOptions)
    .innerJoin(questions, eq(questions.id, questionOptions.questionId))
    .where(and(eq(questionOptions.id, optionId), eq(questions.id, questionId)))
    .limit(1)
  return row as { correct: boolean; explanation: Partial<Record<Locale, string>> | null; lessonId: number } | undefined
}

export const findLessonScope = async (lessonId: number, userId: string) => {
  const [lesson] = await db
    .select({
      archivedAt: courses.archivedAt,
      courseId: courses.id,
      languages: courses.languages,
      slug: courses.slug,
      type: courses.type,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.id, lessonId))
    .limit(1)
  if (!lesson) return null

  const [siblings, enrollment] = await Promise.all([
    db
      .select({ completed: userLessons.id, id: lessons.id })
      .from(lessons)
      .leftJoin(userLessons, and(eq(userLessons.lessonId, lessons.id), eq(userLessons.userId, userId)))
      .where(eq(lessons.courseId, lesson.courseId))
      .orderBy(asc(lessons.sortOrder), asc(lessons.id)),
    db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, lesson.courseId)))
      .limit(1),
  ])

  return {
    course: lesson,
    enrolled: enrollment.length > 0,
    lessons: siblings.map(({ completed, id }) => ({ completed: completed !== null, id })),
  }
}

export const hasEligibilityEvent = async (userId: string) => {
  const [row] = await db
    .select({ id: activityEvents.id })
    .from(activityEvents)
    .where(and(eq(activityEvents.actorId, userId), eq(activityEvents.action, 'learning.eligible')))
    .limit(1)
  return !!row
}

export const findCompletionDetails = async (courseId: number, userId: string) => {
  const [assessmentRows, [rating]] = await Promise.all([
    db
      .select({ title: lessons.title, value: userAssessments.value })
      .from(userAssessments)
      .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
      .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
      .where(and(eq(userAssessments.userId, userId), eq(lessons.courseId, courseId)))
      .orderBy(asc(lessons.sortOrder)),
    db
      .select({ comment: courseRatings.comment, rating: courseRatings.rating })
      .from(courseRatings)
      .where(and(eq(courseRatings.userId, userId), eq(courseRatings.courseId, courseId)))
      .limit(1),
  ])
  return { assessmentRows, rating: rating ?? null }
}

export const findRecommendationCandidates = async (
  userId: string,
  types: ('intro' | 'learner' | 'skill')[],
  excludeId: number
) => {
  if (types.length === 0) return []
  const rows = await db.query.courses.findMany({
    columns: {
      icon: true,
      id: true,
      languages: true,
      skillGroupId: true,
      slug: true,
      sortOrder: true,
      title: true,
      type: true,
    },
    where: and(isNull(courses.archivedAt), inArray(courses.type, types), ne(courses.id, excludeId)),
    with: {
      lessons: { columns: { id: true }, limit: 1 },
      userCourses: { columns: { completedAt: true }, where: eq(userCourses.userId, userId) },
    },
  })
  return rows.reduce<RecommendationCandidate[]>(
    (candidates, { languages, lessons: lessonRows, userCourses: enrolled, ...row }) => {
      if (!languages?.length || lessonRows.length === 0 || enrolled[0]?.completedAt) return candidates
      candidates.push(row as RecommendationCandidate)
      return candidates
    },
    []
  )
}

export const findCompletedEnrollment = async (userId: string, courseId: number) => {
  const [row] = await db
    .select({ completedAt: userCourses.completedAt, slug: courses.slug })
    .from(userCourses)
    .innerJoin(courses, eq(courses.id, userCourses.courseId))
    .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)))
    .limit(1)
  return row?.completedAt ? { slug: row.slug } : null
}

export const findCourseAnalytics = async (courseId: number) => {
  const [[enrollment], [completed], lessonRows, ratingRows, assessmentRows] = await Promise.all([
    db.select({ total: count() }).from(userCourses).where(eq(userCourses.courseId, courseId)),
    db
      .select({ total: count() })
      .from(userCourses)
      .where(and(eq(userCourses.courseId, courseId), isNotNull(userCourses.completedAt))),
    db
      .select({ done: count(userLessons.id), id: lessons.id, title: lessons.title })
      .from(lessons)
      .leftJoin(userLessons, eq(userLessons.lessonId, lessons.id))
      .where(eq(lessons.courseId, courseId))
      .groupBy(lessons.id)
      .orderBy(asc(lessons.sortOrder)),
    db.select({ rating: courseRatings.rating }).from(courseRatings).where(eq(courseRatings.courseId, courseId)),
    db
      .select({ value: userAssessments.value })
      .from(userAssessments)
      .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
      .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
      .where(eq(lessons.courseId, courseId)),
  ])
  return buildAnalytics({
    completedCount: completed?.total ?? 0,
    enrollmentCount: enrollment?.total ?? 0,
    lessons: lessonRows,
    ratings: ratingRows.map(({ rating }) => rating),
    selfAssessments: assessmentRows.map(({ value }) => value),
  })
}

export const findSkillFramework = async () => {
  const [groups, ungrouped] = await Promise.all([
    db.query.skillGroups.findMany({
      orderBy: [asc(skillGroups.sortOrder), asc(skillGroups.id)],
      with: {
        courses: {
          columns: { archivedAt: true, id: true, languages: true, slug: true, sortOrder: true, title: true },
          orderBy: [asc(courses.sortOrder), asc(courses.id)],
          where: eq(courses.type, 'skill'),
        },
      },
    }),
    db.query.courses.findMany({
      columns: { archivedAt: true, id: true, languages: true, slug: true, sortOrder: true, title: true },
      orderBy: [asc(courses.sortOrder), asc(courses.id)],
      where: and(eq(courses.type, 'skill'), isNull(courses.skillGroupId)),
    }),
  ])
  return { groups, ungrouped }
}

export const findSkillCompass = async (userId: string) => {
  const rows = await db
    .select({ courseId: userSkillCompass.courseId, kind: userSkillCompass.kind })
    .from(userSkillCompass)
    .where(eq(userSkillCompass.userId, userId))
    .orderBy(asc(userSkillCompass.id))
  return rows.reduce<{ goals: number[]; strengths: number[] }>(
    (compass, { courseId, kind }) => {
      compass[kind === 'goal' ? 'goals' : 'strengths'].push(courseId)
      return compass
    },
    { goals: [], strengths: [] }
  )
}

export const findSkillOptions = async (userId: string, language: Locale): Promise<SkillOption[]> => {
  const rows = await db.query.courses.findMany({
    columns: { icon: true, id: true, languages: true, skillGroupId: true, slug: true, sortOrder: true, title: true },
    orderBy: [asc(courses.sortOrder), asc(courses.id)],
    where: and(eq(courses.type, 'skill'), isNull(courses.archivedAt)),
    with: {
      lessons: { columns: { id: true }, limit: 1 },
      userCourses: { columns: { completedAt: true }, where: eq(userCourses.userId, userId) },
    },
  })
  return rows.reduce<SkillOption[]>((options, row) => {
    if (!row.languages?.length || row.lessons.length === 0) return options
    options.push({
      completed: !!row.userCourses[0]?.completedAt,
      icon: row.icon,
      id: row.id,
      skillGroupId: row.skillGroupId,
      slug: row.slug,
      sortOrder: row.sortOrder,
      title: pickLocale(row.title, language) ?? row.slug,
    })
    return options
  }, [])
}
