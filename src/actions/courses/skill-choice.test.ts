import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSkillChoice, resolveSkillChoice, skillChoiceToken } from './skill-choice'

const descriptions = {
  advanced: { en: 'Advanced text', es: 'Texto avanzado', it: 'Testo avanzato' },
  good: { en: 'Good text', es: 'Texto bueno', it: 'Testo buono' },
  intermediate: { en: 'Intermediate text', es: 'Texto medio', it: 'Testo medio' },
}

describe('skill choice blindness', () => {
  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'e'.repeat(43).concat('='))
  })

  it('sends opaque ids and texts only, in an order independent of the level', () => {
    const choice = buildSkillChoice({ chosen: 'good', courseId: 1, descriptions, language: 'en', userId: 'u1' })
    expect(choice?.cards).toHaveLength(3)
    expect(JSON.stringify(choice)).not.toMatch(/"(intermediate|good|advanced)"/u)
    expect(choice?.cards.map(({ id }) => id)).toEqual(choice?.cards.map(({ id }) => id).toSorted())
    expect(choice?.chosenId).toBe(skillChoiceToken('u1', 1, 'good'))
  })

  it('resolves a token to its level on the server and rejects anything else', () => {
    for (const level of ['intermediate', 'good', 'advanced'] as const) {
      expect(resolveSkillChoice('u1', 1, skillChoiceToken('u1', 1, level))).toBe(level)
    }
    expect(resolveSkillChoice('u1', 1, 'advanced')).toBeNull()
    expect(resolveSkillChoice('u1', 1, skillChoiceToken('u2', 1, 'good'))).toBeNull()
    expect(resolveSkillChoice('u1', 2, skillChoiceToken('u1', 1, 'good'))).toBeNull()
    expect(resolveSkillChoice('u1', 1, null)).toBeNull()
  })

  it('refuses to build a choice when a description is missing', () => {
    expect(
      buildSkillChoice({
        chosen: null,
        courseId: 1,
        descriptions: { ...descriptions, good: { en: ' ', es: '', it: '' } },
        language: 'en',
        userId: 'u1',
      })
    ).toBeNull()
  })
})
