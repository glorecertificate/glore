import { createLoader } from 'nuqs/server'
import { describe, expect, it } from 'vitest'

import { adminUsersParsers } from '@/components/features/admin/users-params'

const load = createLoader(adminUsersParsers)

describe('adminUsersParsers', () => {
  it('reads an old single organization URL as a list of one', () => {
    expect(load('?org=7').org).toEqual([7])
  })

  it('reads a comma separated list of organizations', () => {
    expect(load('?org=7,9').org).toEqual([7, 9])
  })

  it('defaults to no organization', () => {
    expect(load('').org).toEqual([])
  })
})
