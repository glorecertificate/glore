import { describe, expect, it } from 'vitest'

import { certificatePdfLabels, generateCertificatePdf } from '@/components/features/certificates/generate-pdf'

const task = 'Welcomed new volunteers and organized weekly activities for children at the community centre'

const input = (skillCount: number) => ({
  activity: {
    duration: 120,
    endDate: '2026-06-30',
    location: 'Milan',
    startDate: '2026-01-10',
    tasks: [task, task, task],
  },
  code: 'ABCD-EFGH-JKMN',
  holder: {
    birthPlace: 'Manchester',
    birthday: '2000-01-01',
    firstName: 'Oliver',
    lastName: 'Matthews',
    nationality: 'GB',
  },
  issuedAt: '2026-07-01T10:00:00Z',
  organization: { legalRepresentative: 'Maria Rossi', logoUrl: null, name: 'Associazione Joint', signatureUrl: null },
  skills: ['messages-square', 'users', 'heart-handshake', 'flag'].slice(0, skillCount).map((icon, index) => ({
    icon,
    level: index + 2,
    name: `Skill ${index + 1}`,
    statement: 'Listened to the needs of the group and adapted the plan to include everyone.',
  })),
})

describe('generateCertificatePdf', () => {
  it.each([
    ['en', 4],
    ['es', 4],
    ['it', 3],
  ])('renders a %s certificate with %i skills', async (language, skillCount) => {
    const buffer = await generateCertificatePdf(input(skillCount), language)
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.length).toBeGreaterThan(10_000)
  })

  it('localizes labels and falls back to English', async () => {
    expect((await certificatePdfLabels('it')).title).toBe('Certificato di soft skills')
    expect((await certificatePdfLabels('fr')).title).toBe('Soft skills certificate')
    expect((await certificatePdfLabels('es')).levels).toHaveLength(5)
  })
})
