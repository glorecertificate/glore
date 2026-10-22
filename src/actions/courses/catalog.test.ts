import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { type Course, parseCourse } from '@/db/queries/course'
import { type SkillOption, recommendFromCompass, validateCompass } from '@/db/queries/learning'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from './learning.fixture'

vi.mock('next/cache', () => ({ cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/actions/session', () => ({ getSessionUser: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const emptyCourse = {
  archivedAt: null,
  archivedBy: null,
  createdAt: '2026-01-01',
  creator: null,
  description: null,
  durationMinutes: null,
  icon: null,
  id: 1,
  languages: ['en'],
  lessons: [],
  outcomes: null,
  skillGroup: null,
  slug: 'empty',
  sortOrder: 1,
  title: null,
  type: 'intro',
  updatedAt: '2026-01-01',
  userCourses: [],
} as unknown as Parameters<typeof parseCourse>[0]

describe('parseCourse', () => {
  it('reports zero progress for a course without lessons', () => {
    const course: Course = parseCourse(emptyCourse)
    expect(course.progress).toBe(0)
    expect(course.progressStatus).toBe('notStarted')
    expect(course.completed).toBe(false)
    expect(course.rating).toEqual({ average: null, count: 0 })
  })

  it('keeps the rating summary it receives', () => {
    expect(parseCourse({ ...emptyCourse, rating: { average: 4.5, count: 2 } }).rating).toEqual({
      average: 4.5,
      count: 2,
    })
  })
})

describe('skill compass rules', () => {
  const available = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])

  it('accepts up to 3 strengths and 5 goals that do not overlap', () => {
    expect(validateCompass({ goals: [4, 5, 6, 7, 8], strengths: [1, 2, 3] }, available)).toEqual({
      goals: [4, 5, 6, 7, 8],
      strengths: [1, 2, 3],
    })
  })

  it('rejects too many picks, duplicates, overlaps, and unknown courses', () => {
    expect(validateCompass({ goals: [], strengths: [1, 2, 3, 4] }, available)).toEqual({ issue: 'TOO_MANY_STRENGTHS' })
    expect(validateCompass({ goals: [1, 2, 3, 4, 5, 6], strengths: [] }, available)).toEqual({
      issue: 'TOO_MANY_GOALS',
    })
    expect(validateCompass({ goals: [1, 1], strengths: [] }, available)).toEqual({ issue: 'DUPLICATE' })
    expect(validateCompass({ goals: [1], strengths: [1] }, available)).toEqual({ issue: 'OVERLAP' })
    expect(validateCompass({ goals: [99], strengths: [] }, available)).toEqual({ issue: 'UNKNOWN_COURSE' })
  })
})

describe('recommendFromCompass', () => {
  const option = (id: number, overrides: Partial<SkillOption> = {}): SkillOption => ({
    completed: false,
    icon: null,
    id,
    skillGroupId: null,
    slug: `s${id}`,
    sortOrder: id,
    title: `Skill ${id}`,
    ...overrides,
  })

  it('puts open goals first in the chosen order, then fills with the next skills', () => {
    const picked = recommendFromCompass([option(1), option(2), option(3), option(4)], [3, 2], 3)
    expect(picked.map(({ id }) => id)).toEqual([3, 2, 1])
  })

  it('skips completed skills', () => {
    const picked = recommendFromCompass([option(1, { completed: true }), option(2), option(3)], [1], 2)
    expect(picked.map(({ id }) => id)).toEqual([2, 3])
  })
})

describe.skipIf(!isLocalDatabase)('catalog and compass', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let helpers: typeof import('./helpers')
  let learning: typeof import('./learning')
  let data: typeof import('./data')

  beforeAll(async () => {
    context = await loadContext()
    ;[fixture, helpers, learning, data] = await Promise.all([
      createFixtureCourse(context),
      import('./helpers'),
      import('./learning'),
      import('./data'),
    ])
  })

  afterAll(async () => {
    await removeFixtureCourse(context, fixture)
  })

  it('never puts lesson content or isCorrect in the catalog payload', async () => {
    const [forLearner, forEditor] = await Promise.all([
      helpers.queryCatalog(context.userId),
      helpers.queryCatalog(undefined),
    ])
    const courses = [forLearner, forEditor].map(catalog => catalog.find(({ id }) => id === fixture.courseId))
    expect(courses.map(course => course?.lessons.length)).toEqual([3, 3])
    expect(courses.map(course => JSON.stringify(course).includes('isCorrect'))).toEqual([false, false])
    expect(courses.map(course => course?.lessons.some(lesson => 'content' in lesson))).toEqual([false, false])
  })

  it('stores the compass, replaces it, and rejects invalid picks', async () => {
    const learner = {
      canEdit: false,
      organizationId: context.organizationId,
      role: 'volunteer' as const,
      userId: context.userId,
    }
    expect(await learning.saveCompass(learner, { goals: [fixture.courseId], strengths: [] }, 'en')).toEqual({
      data: { saved: true },
    })
    expect(await data.findSkillCompass(context.userId)).toEqual({ goals: [fixture.courseId], strengths: [] })

    expect(await learning.saveCompass(learner, { goals: [], strengths: [fixture.courseId] }, 'en')).toEqual({
      data: { saved: true },
    })
    expect(await data.findSkillCompass(context.userId)).toEqual({ goals: [], strengths: [fixture.courseId] })

    expect(await learning.saveCompass(learner, { goals: [-1], strengths: [] }, 'en')).toEqual({
      error: 'UNKNOWN_COURSE',
    })
    expect(await learning.saveCompass({ ...learner, role: 'learner' }, { goals: [], strengths: [] }, 'en')).toEqual({
      error: 'FORBIDDEN',
    })
    expect(await data.findSkillCompass(context.userId)).toEqual({ goals: [], strengths: [fixture.courseId] })
  })
})
