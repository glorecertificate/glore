import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from './learning.fixture'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('course overview data', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let data: typeof import('./data')
  let learning: typeof import('@/db/queries/learning')

  beforeAll(async () => {
    context = await loadContext()
    ;[fixture, data, learning] = await Promise.all([
      createFixtureCourse(context),
      import('./data'),
      import('@/db/queries/learning'),
    ])
  })

  afterAll(async () => {
    await removeFixtureCourse(context, fixture)
  })

  it('builds the overview for a learner who has not started', async () => {
    const row = await data.findCourseOverview(fixture.slug, context.userId)
    if (!row) throw new Error('Missing course')
    const overview = learning.buildOverview(row, 'en')
    expect(overview.lessons).toHaveLength(3)
    expect(overview.lessons.map(lesson => lesson.hasQuiz)).toEqual([false, true, false])
    expect(overview.lessons[2]).toMatchObject({ hasAssessment: true, hasEvaluations: true })
    expect(overview.enrollment).toBeNull()
    expect(overview.progress.percent).toBe(0)
    expect(JSON.stringify(overview)).not.toContain('isCorrect')
  })

  it('reports no completed skill courses for a fresh learner', async () => {
    const progress = await data.getSkillProgress(context.userId)
    expect(progress.completedCourseIds).not.toContain(fixture.courseId)
  })
})
