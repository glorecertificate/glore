import { z } from 'zod'

import { type AdminPage } from '@/db/queries/admin-user'
import { type CertificateStatus } from '@/db/queries/certificate'

export const ADMIN_CERTIFICATES_PAGE_SIZE = 20

export const ADMIN_CERTIFICATE_STATUSES = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
  'revoked',
] as const satisfies CertificateStatus[]

export type AdminCertificateStatus = (typeof ADMIN_CERTIFICATE_STATUSES)[number]

export const adminCertificatesQuerySchema = z.object({
  page: z.number().int().min(1).max(10_000).nullish(),
  q: z.string().max(200).nullish(),
  status: z.enum(ADMIN_CERTIFICATE_STATUSES).nullish(),
})

export type AdminCertificatesQuery = z.input<typeof adminCertificatesQuerySchema>

export interface AdminCertificateRow {
  code: string | null
  holder: { email: string | null; firstName: string; id: string | null; lastName: string | null }
  id: number
  issuedAt: string | null
  organization: { id: number; name: string }
  revokedAt: string | null
  status: AdminCertificateStatus
  submittedAt: string | null
}

export type AdminCertificatePage = AdminPage<AdminCertificateRow>
