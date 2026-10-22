import { describe, expect, it } from 'vitest'

import { ONBOARDING_NEXT_HREFS, onboardingNextStep } from '@/db/queries/onboarding'

describe('onboardingNextStep', () => {
  it('sends tutors to the queue first', () => {
    expect(onboardingNextStep(['volunteer', 'tutor'])).toBe('queue')
  })

  it('sends organization managers to the checklist', () => {
    expect(onboardingNextStep(['admin'])).toBe('organization')
    expect(onboardingNextStep(['representative'])).toBe('organization')
  })

  it('sends learners and volunteers to the compass', () => {
    expect(onboardingNextStep(['learner'])).toBe('compass')
    expect(onboardingNextStep(['volunteer'])).toBe('compass')
  })

  it('falls back to the catalog without memberships', () => {
    expect(onboardingNextStep([])).toBe('catalog')
    expect(ONBOARDING_NEXT_HREFS.catalog).toBe('/courses')
  })
})
