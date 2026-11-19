import { describe, expect, it } from 'vitest'

import { adminCertificatesQuerySchema } from '@/db/queries/admin-certificate'

describe('adminCertificatesQuerySchema', () => {
  it('normalizes a single status or a list into a list', () => {
    expect(adminCertificatesQuerySchema.parse({}).status).toEqual([])
    expect(adminCertificatesQuerySchema.parse({ status: null }).status).toEqual([])
    expect(adminCertificatesQuerySchema.parse({ status: 'submitted' }).status).toEqual(['submitted'])
    expect(adminCertificatesQuerySchema.parse({ status: ['submitted', 'revoked'] }).status).toEqual([
      'submitted',
      'revoked',
    ])
  })

  it.each([{ status: 'draft' }, { status: ['submitted', 'unknown'] }, { page: 0 }])('rejects %o', input => {
    expect(adminCertificatesQuerySchema.safeParse(input).success).toBe(false)
  })
})
