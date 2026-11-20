import { createLoader } from 'nuqs/server'
import { describe, expect, it } from 'vitest'

import { adminAuditParsers } from '@/components/features/admin/audit-params'

const load = createLoader(adminAuditParsers)

describe('adminAuditParsers', () => {
  it('reads an old single category URL as a list of one', () => {
    expect(load('?category=moderation').category).toEqual(['moderation'])
  })

  it('reads a comma separated list and drops unknown values', () => {
    expect(load('?category=moderation,legal').category).toEqual(['moderation', 'legal'])
    expect(load('?category=bogus').category).toEqual([])
  })

  it('defaults to no category', () => {
    expect(load('').category).toEqual([])
  })
})
