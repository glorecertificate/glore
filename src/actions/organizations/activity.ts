'use server'

import 'server-only'

import { listOrganizationActivity } from '@/actions/organizations/activity-core'
import { getOrganizationAccess } from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { memberError } from '@/db/mutations/organization'

export const getOrganizationActivity = async (cursor?: number, organizationId?: number) =>
  await guarded(async () => {
    const access = await getOrganizationAccess(organizationId)
    if (access.role !== 'admin' && access.role !== 'representative') throw memberError('FORBIDDEN')
    if (cursor !== undefined && !Number.isInteger(cursor)) throw memberError('INVALID')
    return await listOrganizationActivity(access.organizationId, { cursor })
  })
