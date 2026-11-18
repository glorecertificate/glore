'use server'

import 'server-only'

import { queryAdminCertificates } from '@/actions/admin/certificates-core'
import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { type AdminCertificatesQuery } from '@/db/queries/admin-certificate'

export const searchAdminCertificates = async (input: AdminCertificatesQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    return await queryAdminCertificates(input)
  })
