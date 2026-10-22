import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expireAdminOverview, expireOrganizations, expireTeam } from '@/actions/admin/expire'
import { CacheTag } from '@/lib/cache'

const updateTag = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ updateTag }))

describe('admin cache expiry', () => {
  beforeEach(() => {
    updateTag.mockClear()
  })

  it('expires the overview tag on its own', () => {
    expireAdminOverview()

    expect(updateTag.mock.calls).toEqual([[CacheTag.AdminOverview]])
  })

  it('expires organizations and the overview together, so the application queue and pending counts read fresh', () => {
    expireOrganizations()

    expect(updateTag.mock.calls).toEqual([[CacheTag.Organizations], [CacheTag.AdminOverview]])
  })

  it('expires the team list and the overview together', () => {
    expireTeam()

    expect(updateTag.mock.calls).toEqual([[CacheTag.TeamMembers], [CacheTag.AdminOverview]])
  })
})
