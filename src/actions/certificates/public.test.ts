import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase, session } from '@/actions/certificates/test-harness'
import { generateCertificateCode } from '@/components/features/certificates/rules'

vi.mock('@/lib/rate-limit', async () => (await import('@/actions/certificates/test-harness')).mocks.rateLimit)

describe.skipIf(!isLocalDatabase)('public certificate lookups', () => {
  let fixture: Fixture
  let pub: typeof import('@/actions/certificates/public')

  beforeAll(async () => {
    fixture = await createFixture()
    pub = await import('@/actions/certificates/public')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  describe('verifyCertificate', () => {
    it('describes an approved certificate from the live data when there is no snapshot', async () => {
      const code = generateCertificateCode()
      await fixture.insertCertificate({ code, status: 'approved' })

      const result = await pub.verifyCertificate(code)

      expect(result).toMatchObject({
        activity: { duration: 120, location: 'Milan' },
        code,
        holder: { firstName: 'author', lastName: 'Tester' },
        outcome: 'found',
        revokedAt: null,
        status: 'valid',
      })
      expect(result.outcome === 'found' && result.skills).toHaveLength(3)
    })

    it('prefers the immutable snapshot of an issued certificate', async () => {
      const code = generateCertificateCode()
      const cert = await fixture.insertCertificate({ code, status: 'approved' })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({
          snapshot: {
            activity: {
              duration: 99,
              endDate: '2026-02-01',
              location: 'Rome',
              startDate: '2026-01-01',
              tasks: ['Desk'],
            },
            holder: {
              birthPlace: 'Milan',
              birthday: '2000-01-01',
              firstName: 'Ada',
              lastName: 'Lovelace',
              nationality: 'it',
            },
            issuedAt: '2026-03-01T10:00:00.000Z',
            language: 'es',
            organization: {
              id: 1,
              legalRepresentative: 'Rep One',
              logoUrl: null,
              name: 'Snapshot Org',
              signatureUrl: null,
            },
            skills: [
              {
                courseId: 1,
                icon: null,
                level: 5,
                name: { en: 'Teamwork', es: 'Trabajo en equipo', it: 'Lavoro di squadra' },
                statement: 'Led it',
              },
            ],
          },
        })
        .where(eq(fixture.schema.certificates.id, cert.id))

      const result = await pub.verifyCertificate(code)

      expect(result).toMatchObject({
        activity: { duration: 99, location: 'Rome' },
        holder: { firstName: 'Ada', lastName: 'Lovelace' },
        issuedAt: '2026-03-01T10:00:00.000Z',
        language: 'es',
        organization: { legalRepresentative: 'Rep One', name: 'Snapshot Org' },
        outcome: 'found',
      })
      expect(result.outcome === 'found' && result.skills[0]).toMatchObject({ level: 5, statement: 'Led it' })
    })

    it('reports a revoked certificate with its revocation date and no reason', async () => {
      const code = generateCertificateCode()
      const cert = await fixture.insertCertificate({ code, status: 'revoked' })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ revokedAt: '2026-04-01T08:00:00.000Z', revokedReason: 'Private reason' })
        .where(eq(fixture.schema.certificates.id, cert.id))

      const result = await pub.verifyCertificate(code)

      expect(result).toMatchObject({ outcome: 'found', status: 'revoked' })
      expect(result.outcome === 'found' && result.revokedAt).toContain('2026-04-01')
      expect(JSON.stringify(result)).not.toContain('Private reason')
    })

    it.each(['draft', 'submitted', 'in_review', 'changes_requested', 'rejected', 'withdrawn'] as const)(
      'does not expose a %s certificate',
      async status => {
        const code = generateCertificateCode()
        await fixture.insertCertificate({ code, reviewer: 'tutorA', status })
        expect(await pub.verifyCertificate(code)).toEqual({ outcome: 'unknown' })
      }
    )

    it('returns unknown for a code that does not exist', async () => {
      expect(await pub.verifyCertificate('0000-0000-0000')).toEqual({ outcome: 'unknown' })
    })

    it('stops answering when the caller is rate limited', async () => {
      const code = generateCertificateCode()
      await fixture.insertCertificate({ code, status: 'approved' })
      session.rateLimited = true
      expect(await pub.verifyCertificate(code)).toEqual({ outcome: 'limited' })
    })
  })

  describe('findLegacyCertificateCode', () => {
    it('maps an old username and handle to the public code', async () => {
      const code = generateCertificateCode()
      const cert = await fixture.insertCertificate({ code, status: 'approved' })
      await fixture.db
        .update(fixture.schema.users)
        .set({ username: `lane-a-${cert.handle}` })
        .where(eq(fixture.schema.users.id, fixture.ids.author))

      expect(await pub.findLegacyCertificateCode(`lane-a-${cert.handle}`, cert.handle)).toBe(code)
      expect(await pub.findLegacyCertificateCode('someone-else', cert.handle)).toBeNull()
      expect(await pub.findLegacyCertificateCode(`lane-a-${cert.handle}`, 'unknown-handle')).toBeNull()

      await fixture.db
        .update(fixture.schema.users)
        .set({ username: null })
        .where(eq(fixture.schema.users.id, fixture.ids.author))
    })

    it('ignores certificates that are not public', async () => {
      const cert = await fixture.insertCertificate({
        code: generateCertificateCode(),
        reviewer: 'tutorA',
        status: 'submitted',
      })
      await fixture.db
        .update(fixture.schema.users)
        .set({ username: `lane-a-${cert.handle}` })
        .where(eq(fixture.schema.users.id, fixture.ids.author))

      expect(await pub.findLegacyCertificateCode(`lane-a-${cert.handle}`, cert.handle)).toBeNull()

      await fixture.db
        .update(fixture.schema.users)
        .set({ username: null })
        .where(eq(fixture.schema.users.id, fixture.ids.author))
    })
  })
})
