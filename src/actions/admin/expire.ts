import 'server-only'

import { updateTag } from 'next/cache'

import { CacheTag } from '@/lib/cache'

export const expireAdminOverview = () => updateTag(CacheTag.AdminOverview)

export const expireOrganizations = () => {
  updateTag(CacheTag.Organizations)
  expireAdminOverview()
}

export const expireTeam = () => {
  updateTag(CacheTag.TeamMembers)
  expireAdminOverview()
}
