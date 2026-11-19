import { describe, expect, it } from 'vitest'

import { adminUsersQuerySchema } from '@/db/queries/admin-user'

describe('adminUsersQuerySchema organizations', () => {
  it('normalizes a single id or a list into a list', () => {
    expect(adminUsersQuerySchema.parse({}).organizationIds).toEqual([])
    expect(adminUsersQuerySchema.parse({ organizationIds: null }).organizationIds).toEqual([])
    expect(adminUsersQuerySchema.parse({ organizationIds: 4 }).organizationIds).toEqual([4])
    expect(adminUsersQuerySchema.parse({ organizationIds: [4, 5] }).organizationIds).toEqual([4, 5])
  })

  it.each([{ organizationIds: 0 }, { organizationIds: [1, -2] }, { organizationIds: ['a'] }])('rejects %o', input => {
    expect(adminUsersQuerySchema.safeParse(input).success).toBe(false)
  })
})
