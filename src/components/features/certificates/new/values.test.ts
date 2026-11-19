import { describe, expect, it } from 'vitest'

import {
  type WizardDraft,
  certificateWizardValues,
  emptyWizardValues,
  prefillValues,
  resumeStep,
  toEditValues,
  withdrawnSource,
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

  it('keeps the evidence per skill and carries no level', () => {
    const edit = toEditValues(
      complete({
        skills: [
          { courseId: 1, evidence: ' example ' },
          { courseId: 2, evidence: '' },
        ],
      })
    )
    expect(edit.skills).toEqual([
      { courseId: 1, evidence: 'example' },
      { courseId: 2, evidence: null },
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
        skills: [{ courseId: 1, evidence: '' }],
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
  it('restores a stored draft in skill order without any level', () => {
    const certificate = {
      activityDuration: 0,
      activityEndDate: '',
      activityLocation: '',
      activityStartDate: '',
      language: 'it',
      rating: null,
      skills: [
        { course: { id: 2 }, evidence: null, sortOrder: 1 },
        { course: { id: 1 }, evidence: 'a', sortOrder: 0 },
      ],
      tasks: [],
    } as unknown as Certificate

    const values = certificateWizardValues(certificate, emptyWizardValues('en', holder))
    expect(values.language).toBe('it')
    expect(values.activityDuration).toBeUndefined()
    expect(values.tasks).toEqual([{ text: '' }])
    expect(values.skills).toEqual([
      { courseId: 1, evidence: 'a' },
      { courseId: 2, evidence: '' },
    ])
  })
})

describe('resumeStep', () => {
  it('opens a draft on the first step with missing data', () => {
    expect(resumeStep(emptyWizardValues('en', holder))).toBe(0)
    expect(resumeStep(complete({ skills: [] }))).toBe(1)
    expect(resumeStep(complete({ rating: {} }))).toBe(2)
  })

  it('opens a complete draft on the review step', () => {
    expect(resumeStep(complete())).toBe(3)
  })

  it('opens on the review step when only personal data is missing', () => {
    expect(resumeStep(complete(), ['nationality'])).toBe(3)
  })
})

describe('withdrawnSource', () => {
  const make = (id: number, status: string, createdAt: string, organizationId = 1) =>
    ({
      createdAt,
      id,
      isDraft: status === 'draft',
      isWithdrawn: status === 'withdrawn',
      organization: { id: organizationId },
      status,
    }) as unknown as Certificate

  it('returns the latest request of the organization when it was withdrawn', () => {
    const list = [make(1, 'approved', '2026-01-01'), make(2, 'withdrawn', '2026-03-01'), make(3, 'draft', '2026-04-01')]
    expect(withdrawnSource(list, 1)?.id).toBe(2)
  })

  it('returns nothing when a later request exists or another organization withdrew', () => {
    const list = [
      make(1, 'withdrawn', '2026-01-01'),
      make(2, 'approved', '2026-02-01'),
      make(3, 'withdrawn', '2026-03-01', 2),
    ]
    expect(withdrawnSource(list, 1)).toBeNull()
    expect(withdrawnSource([], 1)).toBeNull()
  })
})

describe('prefillValues', () => {
  it('keeps the withdrawn answers and drops skills that are no longer completed', () => {
    const source = {
      activityDuration: 120,
      activityEndDate: '2026-02-01',
      activityLocation: 'Milan',
      activityStartDate: '2026-01-01',
      language: 'en',
      rating: null,
      skills: [
        { course: { id: 1 }, evidence: 'a', sortOrder: 0 },
        { course: { id: 2 }, evidence: 'b', sortOrder: 1 },
      ],
      tasks: ['Welcomed guests'],
    } as unknown as Certificate
    const values = prefillValues(source, emptyWizardValues('en', holder), [1])
    expect(values.activityLocation).toBe('Milan')
    expect(values.tasks).toEqual([{ text: 'Welcomed guests' }])
    expect(values.skills).toEqual([{ courseId: 1, evidence: 'a' }])
  })
})
