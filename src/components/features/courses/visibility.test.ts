import { describe, expect, it } from 'vitest'

import { isListedCourse } from '@/components/features/courses/visibility'

const viewer = (overrides: Partial<Parameters<typeof isListedCourse>[1]> = {}) => ({
  canEdit: false,
  isLearner: false,
  isVolunteer: false,
  ...overrides,
})

describe('isListedCourse', () => {
  it('hides draft and archived courses from non-editors', () => {
    expect(isListedCourse({ publicationStatus: 'draft', type: 'intro' }, viewer({ isVolunteer: true }))).toBe(false)
    expect(isListedCourse({ publicationStatus: 'archived', type: 'intro' }, viewer({ isLearner: true }))).toBe(false)
    expect(isListedCourse({ publicationStatus: 'published', type: 'intro' }, viewer({ isVolunteer: true }))).toBe(true)
    expect(isListedCourse({ publicationStatus: 'partial', type: 'intro' }, viewer())).toBe(true)
  })

  it('hides courses outside the role track', () => {
    expect(isListedCourse({ publicationStatus: 'published', type: 'skill' }, viewer({ isLearner: true }))).toBe(false)
    expect(isListedCourse({ publicationStatus: 'published', type: 'learner' }, viewer({ isVolunteer: true }))).toBe(
      false
    )
    expect(isListedCourse({ publicationStatus: 'published', type: 'skill' }, viewer({ isVolunteer: true }))).toBe(true)
    expect(isListedCourse({ publicationStatus: 'published', type: 'learner' }, viewer({ isLearner: true }))).toBe(true)
  })

  it('lists every course for editors', () => {
    expect(isListedCourse({ publicationStatus: 'draft', type: 'skill' }, viewer({ canEdit: true }))).toBe(true)
    expect(isListedCourse({ publicationStatus: 'archived', type: 'learner' }, viewer({ canEdit: true }))).toBe(true)
  })
})
