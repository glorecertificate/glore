import { describe, expect, it } from 'vitest'

import {
  type SkillOption,
  type WizardDraft,
  certificateWizardValues,
  emptyWizardValues,
  toEditValues,
} from '@/components/features/certificates/new/values'
import { wizardSchema } from '@/components/features/certificates/schemas'
import { type Certificate } from '@/db/queries/certificate'

const holder = { birthPlace: 'Milan', birthday: '2000-01-01', lastName: 'Rossi', nationality: 'it' }

const complete = (overrides: Partial<WizardDraft> = {}): WizardDraft => ({
  ...emptyWizardValues('en', holder),
  activityDuration: 120,
  activityEndDate: '2026-06-30',
  activityLocation: 'Milan',
  activityStartDate: '2026-01-10',
  rating: { experience: 4 },
  skills: [1, 2, 3].map(courseId => ({ courseId, evidence: 'Led the desk', selfLevel: 3 })),
  tasks: [{ text: 'Welcomed new volunteers' }],
  ...overrides,
})

describe('toEditValues', () => {
  it('drops blank tasks, trims text, and caps the list at four tasks', () => {
    const edit = toEditValues(
      complete({
        tasks: [
          { text: ' One ' },
          { text: '' },
          { text: 'x'.repeat(200) },
          { text: 'Three' },
          { text: 'Four' },
          { text: 'Five' },
        ],
      })
    )
    expect(edit.tasks).toHaveLength(4)
    expect(edit.tasks?.[0]).toBe('One')
    expect(edit.tasks?.[1]).toHaveLength(110)
  })

  it('turns an incomplete form into a savable partial draft', () => {
    const edit = toEditValues(emptyWizardValues('es', holder))
    expect(edit).toMatchObject({
      activityDuration: 0,
      activityEndDate: '',
      activityLocation: '',
      activityStartDate: '',
      language: 'es',
      skills: [],
      tasks: [],
    })
    expect(edit.rating).toMatchObject({ experience: null, wouldRecommend: null })
  })

  it('keeps self levels and evidence per skill and nulls invalid levels', () => {
    const edit = toEditValues(
      complete({
        skills: [
          { courseId: 1, evidence: ' example ', selfLevel: 4 },
          { courseId: 2, evidence: '', selfLevel: 9 },
        ],
      })
    )
    expect(edit.skills).toEqual([
      { courseId: 1, evidence: 'example', selfLevel: 4 },
      { courseId: 2, evidence: null, selfLevel: null },
    ])
  })
})

describe('wizardSchema', () => {
  it('accepts a complete form', () => {
    expect(wizardSchema().safeParse(complete()).success).toBe(true)
  })

  it('reports error codes for missing and out of order values', () => {
    const result = wizardSchema().safeParse(
      complete({
        activityEndDate: '2025-01-01',
        skills: [{ courseId: 1, evidence: '', selfLevel: 3 }],
        tasks: [{ text: '' }],
      })
    )
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(({ message, path }) => `${path.join('.')}:${message}`)
    expect(messages).toContain('skills:minSkills')
    expect(messages).toContain('tasks.0.text:required')
  })

  it('flags an end date before the start date', () => {
    const result = wizardSchema().safeParse(complete({ activityEndDate: '2025-01-01' }))
    expect(result.error?.issues.map(({ message }) => message)).toContain('endBeforeStart')
  })

  it('requires only the personal fields the holder is missing', () => {
    const empty = complete({ personal: { birthPlace: '', birthday: '', lastName: '', nationality: '' } })
    expect(wizardSchema([]).safeParse(empty).success).toBe(true)

    const result = wizardSchema(['birthPlace', 'nationality']).safeParse(empty)
    expect(result.error?.issues.map(({ path }) => path.join('.')).sort()).toEqual([
      'personal.birthPlace',
      'personal.nationality',
    ])
  })
})

describe('certificateWizardValues', () => {
  const options: SkillOption[] = [{ icon: null, id: 2, reflection: null, selfLevel: 4, slug: 'two', title: null }]

  it('restores a stored draft in skill order and falls back to the assessed level', () => {
    const certificate = {
      activityDuration: 0,
      activityEndDate: '',
      activityLocation: '',
      activityStartDate: '',
      language: 'it',
      rating: null,
      skills: [
        { course: { id: 2 }, evidence: null, selfLevel: null, sortOrder: 1 },
        { course: { id: 1 }, evidence: 'a', selfLevel: 5, sortOrder: 0 },
      ],
      tasks: [],
    } as unknown as Certificate

    const values = certificateWizardValues(certificate, emptyWizardValues('en', holder), options)
    expect(values.language).toBe('it')
    expect(values.activityDuration).toBeUndefined()
    expect(values.tasks).toEqual([{ text: '' }])
    expect(values.skills).toEqual([
      { courseId: 1, evidence: 'a', selfLevel: 5 },
      { courseId: 2, evidence: '', selfLevel: 4 },
    ])
  })
})
