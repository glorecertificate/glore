import { createLoader } from 'nuqs/server'
import { describe, expect, it } from 'vitest'

import { adminCertificatesParsers } from '@/components/features/admin/certificates-params'

const load = createLoader(adminCertificatesParsers)

describe('adminCertificatesParsers', () => {
  it('reads an old single status URL as a list of one', () => {
    expect(load('?status=submitted').status).toEqual(['submitted'])
  })

  it('reads a comma separated list and drops unknown values', () => {
    expect(load('?status=submitted,revoked').status).toEqual(['submitted', 'revoked'])
    expect(load('?status=bogus').status).toEqual([])
  })

  it('defaults to no status', () => {
    expect(load('').status).toEqual([])
  })
})
