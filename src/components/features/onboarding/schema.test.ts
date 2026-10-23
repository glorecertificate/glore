import { describe, expect, it } from 'vitest'

import { STEP_FIELDS, createOnboardingSchema } from '@/components/features/onboarding/schema'

const schema = createOnboardingSchema(key => key)

const valid = {
  birthPlace: 'Milan, Italy',
  birthday: '1999-04-12',
  confirmPassword: 'Password1!',
  firstName: 'Jane',
  lastName: 'Doe',
  nationality: 'it',
  password: 'Password1!',
  phone: '',
  preferredLanguage: 'en',
  termsAccepted: true,
}

const messages = (values: Record<string, unknown>) => {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('onboarding schema', () => {
  it('accepts a complete profile without a phone', () => {
    expect(messages(valid)).toEqual([])
  })

  it('requires the names, birth data, and nationality', () => {
    expect(messages({ ...valid, birthPlace: ' ', birthday: '', firstName: '', lastName: '', nationality: '' })).toEqual(
      expect.arrayContaining([
        'birthPlaceRequired',
        'birthdayRequired',
        'firstNameRequired',
        'lastNameRequired',
        'nationalityRequired',
      ])
    )
  })

  it('rejects weak and mismatched passwords', () => {
    expect(messages({ ...valid, confirmPassword: 'Password1!', password: 'weak' })).toContain('passwordRequirements')
    expect(messages({ ...valid, confirmPassword: 'Other1234!' })).toContain('passwordMismatch')
  })

  it('maps every step to fields of the schema', () => {
    const fields = new Set(Object.keys(valid))
    for (const step of STEP_FIELDS) {
      for (const field of step) expect(fields.has(field)).toBe(true)
    }
  })
})
