'use server'

import 'server-only'

import { exportAdminAuditCsv, queryAdminAudit } from '@/actions/admin/audit-core'
import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { type AdminAuditQuery } from '@/db/queries/admin-audit'

export const listAdminAudit = async (input: AdminAuditQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    return await queryAdminAudit(input)
  })

export const exportAdminAudit = async (input: AdminAuditQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    return await exportAdminAuditCsv(input)
  })
