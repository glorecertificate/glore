import { eq, inArray } from 'drizzle-orm'

import { SEED_ORG_HANDLE, seedEmail } from '~/scripts/seed-data'

export const loadContext = async (userKey = 'volunteer') => {
  const [client, schema] = await Promise.all([import('@/db/client'), import('@/db/schema')])
  const [user, organization] = await Promise.all([
    client.db.query.users.findFirst({ columns: { id: true }, where: eq(schema.users.email, seedEmail(userKey)) }),
    client.db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(schema.organizations.handle, SEED_ORG_HANDLE),
    }),
  ])
  if (!(user && organization)) throw new Error('Run pnpm run db:seed first')
  return { client, organizationId: organization.id, schema, userId: user.id }
}

export type LearningContext = Awaited<ReturnType<typeof loadContext>>

export interface FixtureCourse {
  assessmentId: number
  courseId: number
  evaluationIds: number[]
  lessonIds: { assessment: number; quiz: number; reading: number }
  options: { correct: number; wrong: number }[]
  questionIds: number[]
  slug: string
}

export const createFixtureCourse = async ({ client, schema }: LearningContext): Promise<FixtureCourse> => {
  const slug = `fixture-${Math.random().toString(36).slice(2, 10)}`
  const text = (value: string) => ({ en: value, es: value, it: value })
  const plate = (value: string) =>
    ({ en: [{ children: [{ text: value }], type: 'p' }] }) as unknown as typeof schema.lessons.$inferInsert.content
  const [course] = await client.db
    .insert(schema.courses)
    .values({
      description: text('Fixture'),
      languages: ['en', 'it'],
      slug,
      title: text('Fixture course'),
      type: 'skill',
    })
    .returning({ id: schema.courses.id })
  if (!course) throw new Error('Fixture course failed')

  const lessonRows = await client.db
    .insert(schema.lessons)
    .values([
      {
        content: plate('Read me'),
        courseId: course.id,
        sortOrder: 1,
        title: text('Reading'),
      },
      {
        content: plate('Quiz intro'),
        courseId: course.id,
        sortOrder: 2,
        title: text('Quiz'),
      },
      {
        content: plate('Reflect'),
        courseId: course.id,
        sortOrder: 3,
        title: text('Assessment'),
      },
    ])
    .returning({ id: schema.lessons.id, sortOrder: schema.lessons.sortOrder })
  const [reading, quiz, assessment] = lessonRows.toSorted((a, b) => a.sortOrder - b.sortOrder)
  if (!(reading && quiz && assessment)) throw new Error('Fixture lessons failed')

  const questions = await client.db
    .insert(schema.questions)
    .values([
      { description: text('Question one'), explanation: text('Because one'), lessonId: quiz.id },
      { description: text('Question two'), explanation: text('Because two'), lessonId: quiz.id },
    ])
    .returning({ id: schema.questions.id })
  const questionIds = questions.map(({ id }) => id)

  const optionRows = await client.db
    .insert(schema.questionOptions)
    .values(
      questionIds.flatMap(questionId => [
        { content: text('Right'), isCorrect: true, questionId },
        { content: text('Wrong'), isCorrect: false, questionId },
      ])
    )
    .returning({
      id: schema.questionOptions.id,
      isCorrect: schema.questionOptions.isCorrect,
      questionId: schema.questionOptions.questionId,
    })
  const options = questionIds.map(questionId => {
    const rows = optionRows.filter(row => row.questionId === questionId)
    return { correct: rows.find(row => row.isCorrect)?.id ?? 0, wrong: rows.find(row => !row.isCorrect)?.id ?? 0 }
  })

  const evaluations = await client.db
    .insert(schema.evaluations)
    .values([
      { description: text('I listen'), lessonId: assessment.id },
      { description: text('I speak'), lessonId: assessment.id },
    ])
    .returning({ id: schema.evaluations.id })
  const [assessmentRow] = await client.db
    .insert(schema.assessments)
    .values({ description: text('Rate yourself'), lessonId: assessment.id })
    .returning({ id: schema.assessments.id })
  if (!assessmentRow) throw new Error('Fixture assessment failed')

  return {
    assessmentId: assessmentRow.id,
    courseId: course.id,
    evaluationIds: evaluations.map(({ id }) => id),
    lessonIds: { assessment: assessment.id, quiz: quiz.id, reading: reading.id },
    options,
    questionIds,
    slug,
  }
}

export const removeFixtureCourse = async ({ client, schema, userId }: LearningContext, fixture: FixtureCourse) => {
  const { db } = client
  const lessonIds = Object.values(fixture.lessonIds)
  const optionIds = fixture.options.flatMap(({ correct, wrong }) => [correct, wrong])
  await db.delete(schema.userAnswers).where(inArray(schema.userAnswers.optionId, optionIds))
  await db.delete(schema.userEvaluations).where(inArray(schema.userEvaluations.evaluationId, fixture.evaluationIds))
  await db.delete(schema.userAssessments).where(eq(schema.userAssessments.assessmentId, fixture.assessmentId))
  await db.delete(schema.userLessons).where(inArray(schema.userLessons.lessonId, lessonIds))
  await db.delete(schema.userCourses).where(eq(schema.userCourses.courseId, fixture.courseId))
  await db.delete(schema.courseRatings).where(eq(schema.courseRatings.courseId, fixture.courseId))
  await db.delete(schema.userSkillCompass).where(eq(schema.userSkillCompass.courseId, fixture.courseId))
  await db.delete(schema.activityEvents).where(eq(schema.activityEvents.subjectId, String(fixture.courseId)))
  await db.delete(schema.notifications).where(eq(schema.notifications.userId, userId))
  await db.delete(schema.questionOptions).where(inArray(schema.questionOptions.id, optionIds))
  await db.delete(schema.questions).where(inArray(schema.questions.id, fixture.questionIds))
  await db.delete(schema.evaluations).where(inArray(schema.evaluations.id, fixture.evaluationIds))
  await db.delete(schema.assessments).where(eq(schema.assessments.id, fixture.assessmentId))
  await db.delete(schema.lessons).where(inArray(schema.lessons.id, lessonIds))
  await db.delete(schema.courses).where(eq(schema.courses.id, fixture.courseId))
}
