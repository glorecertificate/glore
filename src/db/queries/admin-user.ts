import { z } from 'zod'

import { timestampMillis } from '@/db/queries/organization'
import { type User } from '@/db/queries/user'
import { type EnumType } from '@/db/types'

export interface TeamMember extends User {
  invitationOpen: boolean
}

export const ADMIN_USERS_PAGE_SIZE = 20
export const MIN_ADMIN_REASON_LENGTH = 10
export const MAX_ADMIN_REASON_LENGTH = 500
const MAX_SEARCH_TOKENS = 5
const MAX_SEARCH_TOKEN_LENGTH = 50

export const PLATFORM_ROLES = ['admin', 'editor', 'user'] as const
export const USER_STATUSES = ['active', 'pending'] as const
export const BAN_FILTERS = ['yes', 'no'] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]
export type UserStatus = (typeof USER_STATUSES)[number]
export type BanFilter = (typeof BAN_FILTERS)[number]

const ADMIN_ERROR_CODES = [
  'EMAIL_TAKEN',
  'FORBIDDEN',
  'INVALID_INPUT',
  'LAST_ADMIN',
  'NO_CHANGE',
  'NOT_BANNED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'SELF',
  'SEND_FAILED',
  'SOLE_ORG_ADMIN',
  'TARGET_IS_ADMIN',
  'TOO_SOON',
  'UNAUTHORIZED',
] as const

export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[number]

const IMPERSONATION_ERROR_CODES = [
  'ALREADY_IMPERSONATING',
  'CANNOT_IMPERSONATE_ADMINS',
  'CANNOT_IMPERSONATE_SELF',
  'FORBIDDEN',
  'NOT_ALLOWED_WHILE_IMPERSONATING',
  'NOT_IMPERSONATING',
  'NOT_ONBOARDED',
  'TARGET_BANNED',
  'USER_NOT_FOUND',
] as const

export type ImpersonationErrorCode = (typeof IMPERSONATION_ERROR_CODES)[number]

const KNOWN_ERROR_CODES: readonly string[] = [...ADMIN_ERROR_CODES, ...IMPERSONATION_ERROR_CODES]

export const isKnownAdminErrorCode = (
  code: string | null | undefined
): code is AdminErrorCode | ImpersonationErrorCode => KNOWN_ERROR_CODES.includes(code ?? '')

export const isBanActive = (user: { banExpires: string | null; banned: boolean | null }, now = Date.now()) => {
  if (!user.banned) return false
  if (!user.banExpires) return true
  return timestampMillis(user.banExpires) > now
}

export const platformRoleOf = (user: { isEditor: boolean; role: string | null }): PlatformRole => {
  if (user.role === 'admin') return 'admin'
  return user.isEditor ? 'editor' : 'user'
}

const adminReasonSchema = z.string().trim().min(MIN_ADMIN_REASON_LENGTH).max(MAX_ADMIN_REASON_LENGTH)

export const banInputSchema = z.object({
  expiresAt: z.iso
    .datetime({ offset: true })
    .nullish()
    .refine(value => !value || Date.parse(value) > Date.now()),
  reason: adminReasonSchema,
  userId: z.string().min(1).max(200),
})

export type BanInput = z.input<typeof banInputSchema>

export const roleInputSchema = z.object({
  role: z.enum(PLATFORM_ROLES),
  userId: z.string().min(1).max(200),
})

export const impersonationInputSchema = z.object({
  reason: adminReasonSchema,
  userId: z.string().min(1).max(200),
})

export type ImpersonationInput = z.input<typeof impersonationInputSchema>

export const adminUsersQuerySchema = z.object({
  banned: z.enum(BAN_FILTERS).nullish(),
  organizationId: z.number().int().positive().nullish(),
  page: z.number().int().min(1).max(10_000).nullish(),
  q: z.string().max(200).nullish(),
  role: z.enum(PLATFORM_ROLES).nullish(),
  status: z.enum(USER_STATUSES).nullish(),
})

export type AdminUsersQuery = z.input<typeof adminUsersQuerySchema>

export const searchTokens = (query: string | null | undefined) =>
  (query ?? '')
    .split(/\s+/u)
    .flatMap(token => (token.trim() ? [token.trim().slice(0, MAX_SEARCH_TOKEN_LENGTH)] : []))
    .slice(0, MAX_SEARCH_TOKENS)

export const likePattern = (token: string) => `%${token.replaceAll(/[\\%_]/gu, String.raw`\$&`)}%`

interface AdminUserOrganization {
  id: number
  name: string
  role: EnumType<'role'>
}

export interface AdminUserRow {
  avatarUrl: string | null
  banExpires: string | null
  banReason: string | null
  banned: boolean
  createdAt: string
  email: string
  firstName: string
  id: string
  lastName: string | null
  onboardedAt: string | null
  organizations: AdminUserOrganization[]
  platformRole: PlatformRole
  username: string | null
}

export interface AdminPage<T> {
  page: number
  pageCount: number
  pageSize: number
  rows: T[]
  total: number
}

export const toPage = <T>(rows: T[], { page, pageSize, total }: { page: number; pageSize: number; total: number }) => ({
  page,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
  pageSize,
  rows,
  total,
})
