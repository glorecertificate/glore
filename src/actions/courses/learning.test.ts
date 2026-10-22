import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  type LessonDetailRow,
  type LessonStateRow,
  type RecommendationCandidate,
  buildCompletionSkills,
  buildLearnerLesson,
  normalizeCourseRating,
  pickRecommendation,
} from '@/db/queries/learning'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from './learning.fixture'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const detail: LessonDetailRow = {
  assessments: [],
  content: null,
  evaluations: [],
  id: 1,
  questions: [
    {
      description: { en: 'Pick one' },
      explanation: { en: 'Because' },
      id: 7,
      options: [
        { content: { en: 'Yes' }, id: 70 },
        { content: { en: 'No' }, id: 71 },
      ],
    },
  ],
  title: { en: 'Quiz' },
}

const state = (overrides: Partial<LessonStateRow> = {}): LessonStateRow => ({
  answers: [],
  assessment: null,
  completed: false,
  ratings: [],
  ...overrides,
})

describe('buildLearnerLesson', () => {
  it('never exposes isCorrect or the answer before the question is solved', () => {
    const lesson = buildLearnerLesson(detail, state(), 'en')
    const payload = JSON.stringify(lesson)
    expect(payload).not.toContain('isCorrect')
    expect(payload).not.toContain('correct":true')
    expect(lesson.questions[0]).toMatchObject({
      attempted: [],
      correctOptionId: null,
      explanation: null,
      solved: false,
    })
  })

  it('shows the explanation after a wrong attempt without revealing the right option', () => {
    const lesson = buildLearnerLesson(
      detail,
      state({ answers: [{ correct: false, optionId: 71, questionId: 7 }] }),
      'en'
    )
    expect(lesson.questions[0]).toMatchObject({
      attempted: [71],
      correctOptionId: null,
      explanation: 'Because',
      solved: false,
    })
    expect(JSON.stringify(lesson)).not.toContain('isCorrect')
  })

  it('reveals the right option once the question is solved', () => {
    const lesson = buildLearnerLesson(
      detail,
      state({ answers: [{ correct: true, optionId: 70, questionId: 7 }] }),
      'en'
    )
    expect(lesson.questions[0]).toMatchObject({ correctOptionId: 70, solved: true })
  })
})

describe('normalizeCourseRating', () => {
  it('accepts whole ratings from 1 to 5 and trims the comment', () => {
    expect(normalizeCourseRating({ comment: '  Great  ', rating: 5 })).toEqual({ comment: 'Great', rating: 5 })
    expect(normalizeCourseRating({ comment: '   ', rating: 1 })).toEqual({ comment: null, rating: 1 })
  })

  it('rejects out of range, fractional, and too long values', () => {
    expect(normalizeCourseRating({ rating: 0 })).toEqual({ issue: 'INVALID_RATING' })
    expect(normalizeCourseRating({ rating: 6 })).toEqual({ issue: 'INVALID_RATING' })
    expect(normalizeCourseRating({ rating: 2.5 })).toEqual({ issue: 'INVALID_RATING' })
    expect(normalizeCourseRating({ comment: 'x'.repeat(501), rating: 3 })).toEqual({ issue: 'COMMENT_TOO_LONG' })
  })
})

describe('pickRecommendation', () => {
  const candidate = (overrides: Partial<RecommendationCandidate>): RecommendationCandidate => ({
    icon: null,
    id: 1,
    skillGroupId: null,
    slug: 'a',
    sortOrder: null,
    title: { en: 'A' },
    type: 'intro',
    ...overrides,
  })

  it('prefers the same skill group, then the lowest sort order', () => {
    const picked = pickRecommendation(
      [
        candidate({ id: 1, skillGroupId: 2, slug: 'other', sortOrder: 1 }),
        candidate({ id: 2, skillGroupId: 1, slug: 'same-late', sortOrder: 5 }),
        candidate({ id: 3, skillGroupId: 1, slug: 'same-early', sortOrder: 2 }),
      ],
      1,
      'en'
    )
    expect(picked?.slug).toBe('same-early')
  })

  it('returns null without candidates and falls back to the slug without a title', () => {
    expect(pickRecommendation([], 1, 'en')).toBeNull()
    expect(pickRecommendation([candidate({ slug: 'untitled', title: null })], null, 'en')?.title).toBe('untitled')
  })
})

describe('buildCompletionSkills', () => {
  it('localizes titles and clamps levels to 1 through 5', () => {
    expect(
      buildCompletionSkills(
        [
          { title: { en: 'Listening', it: 'Ascolto' }, value: 9 },
          { title: { en: 'Teamwork' }, value: 0 },
        ],
        'it'
      )
    ).toEqual([
      { level: 5, title: 'Ascolto' },
      { level: 1, title: 'Teamwork' },
    ])
  })
})

describe.skipIf(!isLocalDatabase)('learning flow', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let data: typeof import('./data')
  let learning: typeof import('./learning')

  const learner = () => ({
    canEdit: false,
    organizationId: context.organizationId,
    role: 'volunteer' as const,
    userId: context.userId,
  })

  beforeAll(async () => {
    context = await loadContext()
    ;[fixture, data, learning] = await Promise.all([
      createFixtureCourse(context),
      import('./data'),
      import('./learning'),
    ])
  })

  afterAll(async () => {
    await removeFixtureCourse(context, fixture)
  })

  it('serves the quiz lesson without isCorrect and without the answer', async () => {
    const lesson = await data.loadLearnerLesson(fixture.lessonIds.quiz, context.userId, 'en')
    const payload = JSON.stringify(lesson)
    expect(lesson?.questions).toHaveLength(2)
    expect(payload).not.toContain('isCorrect')
    expect(lesson?.questions.every(question => question.correctOptionId === null && !question.solved)).toBe(true)
    expect(lesson?.questions.every(question => question.options.length === 2)).toBe(true)
  })

  it('refuses a learner who has not started the course', async () => {
    const result = await learning.gradeAnswer(learner(), {
      language: 'en',
      optionId: fixture.options[0]!.correct,
      questionId: fixture.questionIds[0]!,
    })
    expect(result).toEqual({ error: 'FORBIDDEN' })
  })

  it('grades answers on the server, allows retries, and saves them', async () => {
    const { client, schema, userId } = context
    await client.db.insert(schema.userCourses).values({ courseId: fixture.courseId, locale: 'en', userId })
    const [first, second] = [fixture.options[0]!, fixture.options[1]!]
    const questionId = fixture.questionIds[0]!

    const ahead = await learning.gradeAnswer(learner(), { language: 'en', optionId: first.wrong, questionId })
    expect(ahead).toEqual({ error: 'FORBIDDEN' })
    await learning.finishLesson(learner(), { language: 'en', lessonId: fixture.lessonIds.reading })

    const wrong = await learning.gradeAnswer(learner(), { language: 'en', optionId: first.wrong, questionId })
    expect(wrong).toEqual({ data: { correct: false, correctOptionId: null, explanation: 'Because one', saved: true } })

    const right = await learning.gradeAnswer(learner(), { language: 'en', optionId: first.correct, questionId })
    expect(right).toMatchObject({ data: { correct: true, correctOptionId: first.correct, saved: true } })

    const again = await learning.gradeAnswer(learner(), { language: 'en', optionId: first.wrong, questionId })
    expect(again).toMatchObject({ data: { correct: false, correctOptionId: first.correct, saved: false } })

    const lesson = await data.loadLearnerLesson(fixture.lessonIds.quiz, userId, 'en')
    expect(lesson?.questions[0]).toMatchObject({
      attempted: [first.correct, first.wrong].toSorted((a, b) => a - b),
      solved: true,
    })
    expect(lesson?.questions[1]?.solved).toBe(false)
    expect(second.correct).toBeGreaterThan(0)
  })

  it('blocks lessons ahead of the learner and incomplete quizzes', async () => {
    const ahead = await learning.finishLesson(learner(), { language: 'en', lessonId: fixture.lessonIds.assessment })
    expect(ahead).toEqual({ error: 'FORBIDDEN' })

    const unsolved = await learning.finishLesson(learner(), { language: 'en', lessonId: fixture.lessonIds.quiz })
    expect(unsolved).toEqual({ error: 'quiz' })
  })

  it('completes the quiz once every question is answered correctly', async () => {
    await learning.gradeAnswer(learner(), {
      language: 'en',
      optionId: fixture.options[1]!.correct,
      questionId: fixture.questionIds[1]!,
    })
    const result = await learning.finishLesson(learner(), { language: 'en', lessonId: fixture.lessonIds.quiz })
    expect(result).toMatchObject({ data: { courseCompleted: false, saved: true } })
  })

  it('requires ratings, a level, and a reflection of 40 to 1000 characters', async () => {
    const lessonId = fixture.lessonIds.assessment
    const ratings = fixture.evaluationIds.map(evaluationId => ({ evaluationId, value: 4 }))

    expect(await learning.finishLesson(learner(), { language: 'en', lessonId })).toEqual({ error: 'evaluations' })
    expect(await learning.finishLesson(learner(), { language: 'en', lessonId, ratings })).toEqual({
      error: 'assessment',
    })
    expect(
      await learning.finishLesson(learner(), {
        assessment: { reflection: 'Too short', value: 4 },
        language: 'en',
        lessonId,
        ratings,
      })
    ).toEqual({ error: 'reflection' })
    expect(
      await learning.finishLesson(learner(), {
        assessment: { reflection: 'x'.repeat(1001), value: 4 },
        language: 'en',
        lessonId,
        ratings,
      })
    ).toEqual({ error: 'reflection' })
    expect(
      await learning.finishLesson(learner(), {
        assessment: { reflection: 'x'.repeat(40), value: 9 },
        language: 'en',
        lessonId,
        ratings,
      })
    ).toEqual({ error: 'assessment' })
  })

  it('refuses a rating before the course is completed', async () => {
    const result = await learning.rateCompletedCourse(learner(), { courseId: fixture.courseId, rating: 5 })
    expect(result).toEqual({ error: 'FORBIDDEN' })
  })

  it('completes the course, stores the reflection, and records the event', async () => {
    const { client, schema, userId } = context
    const lessonId = fixture.lessonIds.assessment
    const reflection = 'I listened to every teammate before the meeting and changed the plan.'
    const result = await learning.finishLesson(learner(), {
      assessment: { reflection, value: 4 },
      language: 'en',
      lessonId,
      ratings: fixture.evaluationIds.map(evaluationId => ({ evaluationId, value: 4 })),
    })
    expect(result).toMatchObject({ data: { courseCompleted: true, saved: true } })
    if (!('data' in result)) throw new Error('Expected data')
    expect(result.data.events.map(event => event.type)).toContain('course.completed')

    const [stored] = await client.db
      .select({ reflection: schema.userAssessments.reflection, value: schema.userAssessments.value })
      .from(schema.userAssessments)
      .where(
        and(eq(schema.userAssessments.userId, userId), eq(schema.userAssessments.assessmentId, fixture.assessmentId))
      )
    expect(stored).toEqual({ reflection, value: 4 })

    const enrollment = await client.db.query.userCourses.findFirst({
      where: and(eq(schema.userCourses.userId, userId), eq(schema.userCourses.courseId, fixture.courseId)),
    })
    expect(enrollment?.completedAt).not.toBeNull()
    expect(enrollment?.lastLessonId).toBe(lessonId)

    const events = await client.db
      .select({ id: schema.activityEvents.id })
      .from(schema.activityEvents)
      .where(
        and(
          eq(schema.activityEvents.action, 'course.completed'),
          eq(schema.activityEvents.subjectId, String(fixture.courseId))
        )
      )
    expect(events).toHaveLength(1)

    const repeat = await learning.finishLesson(learner(), { language: 'en', lessonId })
    expect(repeat).toMatchObject({ data: { courseCompleted: false, saved: false } })
  })

  it('stores one rating per learner and updates it on resubmission', async () => {
    const { client, schema, userId } = context
    const first = await learning.rateCompletedCourse(learner(), {
      comment: '  Clear and practical  ',
      courseId: fixture.courseId,
      rating: 4,
    })
    expect(first).toEqual({ data: { slug: fixture.slug } })
    const second = await learning.rateCompletedCourse(learner(), { courseId: fixture.courseId, rating: 5 })
    expect(second).toEqual({ data: { slug: fixture.slug } })

    const rows = await client.db
      .select({ comment: schema.courseRatings.comment, rating: schema.courseRatings.rating })
      .from(schema.courseRatings)
      .where(and(eq(schema.courseRatings.userId, userId), eq(schema.courseRatings.courseId, fixture.courseId)))
    expect(rows).toEqual([{ comment: null, rating: 5 }])

    const details = await data.findCompletionDetails(fixture.courseId, userId)
    expect(details.rating).toEqual({ comment: null, rating: 5 })
    expect(details.assessmentRows.map(({ value }) => value)).toEqual([4])
  })

  it('reports real analytics for the course', async () => {
    const stats = await data.findCourseAnalytics(fixture.courseId)
    expect(stats).toMatchObject({
      avgRating: 5,
      avgSelfAssessment: 4,
      completionCount: 1,
      completionRate: 100,
      enrollmentCount: 1,
      ratingCount: 1,
    })
    expect(stats.lessonStats.map(({ completionCount }) => completionCount)).toEqual([1, 1, 1])
  })

  it('rejects invalid ratings and editors', async () => {
    expect(await learning.rateCompletedCourse(learner(), { courseId: fixture.courseId, rating: 9 })).toEqual({
      error: 'INVALID_RATING',
    })
    expect(
      await learning.rateCompletedCourse(learner(), {
        comment: 'x'.repeat(501),
        courseId: fixture.courseId,
        rating: 3,
      })
    ).toEqual({ error: 'COMMENT_TOO_LONG' })
    const editor = { canEdit: true, organizationId: null, role: null, userId: context.userId }
    expect(await learning.rateCompletedCourse(editor, { courseId: fixture.courseId, rating: 3 })).toEqual({
      error: 'FORBIDDEN',
    })
  })

  it('writes nothing for viewers and editors', async () => {
    const preview = { canEdit: false, organizationId: null, role: 'tutor' as const, userId: '__viewer__' }
    const graded = await learning.gradeAnswer(preview, {
      language: 'en',
      optionId: fixture.options[0]!.correct,
      questionId: fixture.questionIds[0]!,
    })
    expect(graded).toMatchObject({ data: { correct: true, saved: false } })

    const finished = await learning.finishLesson(preview, { language: 'en', lessonId: fixture.lessonIds.quiz })
    expect(finished).toEqual({ data: { courseCompleted: false, events: [], saved: false } })

    const editor = { canEdit: true, organizationId: null, role: null, userId: '__editor__' }
    expect(await learning.finishLesson(editor, { language: 'en', lessonId: fixture.lessonIds.reading })).toMatchObject({
      data: { saved: false },
    })
  })
})
