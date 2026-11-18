import { describe, expect, it } from 'vitest'

import { parseCertificate } from '@/db/queries/certificate'

const build = (status: string) =>
  parseCertificate({
    organization: { id: 1, name: 'Org', profile: null },
    skills: [{ courseId: 1, level: 'advanced', selfLevel: 'good', sortOrder: 0 }],
    status,
  } as unknown as Parameters<typeof parseCertificate>[0])

describe('parseCertificate level redaction', () => {
  it.each(['draft', 'submitted', 'in_review', 'changes_requested', 'rejected', 'withdrawn'])(
    'never exposes a level before issue (%s)',
    status => {
      expect(build(status).skills[0]).toMatchObject({ level: null, selfLevel: null })
    }
  )

  it.each(['approved', 'revoked'])('exposes the level once issued (%s)', status => {
    expect(build(status).skills[0]).toMatchObject({ level: 'advanced', selfLevel: 'good' })
  })
})
