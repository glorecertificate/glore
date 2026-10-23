import { describe, expect, it, vi } from 'vitest'

import { type CertificatePdfLabels } from '@/components/features/certificates/document'
import { type CertificateSnapshot } from '@/db/schema'

const generate = vi.hoisted(() => vi.fn((..._args: unknown[]) => Promise.resolve(Buffer.from('pdf'))))

vi.mock('@/db/client', () => ({ db: {} }))
vi.mock('@/components/features/certificates/generate-pdf', () => ({ generateCertificatePdf: generate }))

const labels = { title: 'Frozen title', levels: ['1', '2', '3', '4', '5'] } as unknown as CertificatePdfLabels

const snapshot = (withLabels: boolean): CertificateSnapshot => ({
  activity: { duration: 10, endDate: '2026-02-01', location: 'Milan', startDate: '2026-01-01', tasks: ['Task'] },
  holder: { birthPlace: null, birthday: null, firstName: 'Ada', lastName: null, nationality: null },
  issuedAt: '2026-02-02T00:00:00.000Z',
  ...(withLabels && { labels }),
  language: 'it',
  organization: { id: 1, legalRepresentative: null, logoUrl: null, name: 'Org', signatureUrl: null },
  skills: [],
})

describe('certificate snapshot labels', () => {
  it('stores the labels it is given and omits the field otherwise', async () => {
    const { certificateSnapshot } = await import('@/actions/certificates/pdf')
    const source = {
      activityDuration: 10,
      activityEndDate: '2026-02-01',
      activityLocation: 'Milan',
      activityStartDate: '2026-01-01',
      language: 'it',
      organization: { id: 1, name: 'Org', profile: null },
      skills: [],
      tasks: ['Task'],
      user: { birthPlace: null, birthday: null, firstName: 'Ada', lastName: null, nationality: null },
    } as unknown as Parameters<typeof certificateSnapshot>[0]
    expect(certificateSnapshot(source, '2026-02-02T00:00:00.000Z', labels).labels).toEqual(labels)
    expect('labels' in certificateSnapshot(source, '2026-02-02T00:00:00.000Z')).toBe(false)
  })

  it('renders with the frozen labels when the snapshot has them', async () => {
    const { renderCertificatePdf } = await import('@/actions/certificates/pdf')
    generate.mockClear()
    await renderCertificatePdf(snapshot(true), 'CODE')
    expect(generate.mock.calls[0]?.[2]).toBe(labels)
  })

  it('falls back to the current messages for an older snapshot', async () => {
    const { renderCertificatePdf } = await import('@/actions/certificates/pdf')
    generate.mockClear()
    await renderCertificatePdf(snapshot(false), 'CODE')
    expect(generate.mock.calls[0]?.[2]).toBeUndefined()
  })
})
