import { z } from 'zod'

import { optionalHttpUrl } from '@/lib/url'

const MAX_REVIEW_COMMENT_LENGTH = 2000
const MAX_ID = 2_147_483_647

export const organizationHandle = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')

const text = (max: number) => z.string().trim().min(1).max(max)

const email = z.string().trim().toLowerCase().pipe(z.email().max(254))

const name = text(150)
  .min(2)
  .refine(value => organizationHandle(value) !== '')

export const organizationIdSchema = z.int().positive().max(MAX_ID)

export const reviewCommentSchema = z
  .string()
  .trim()
  .max(MAX_REVIEW_COMMENT_LENGTH)
  .optional()
  .transform(value => value || null)

export const createOrganizationInputSchema = z.object({
  city: text(100),
  country: z
    .string()
    .trim()
    .max(2)
    .optional()
    .transform(value => value || null),
  email,
  name,
  url: optionalHttpUrl(500).optional(),
})

export const inviteOrganizationInputSchema = z.object({
  city: text(100),
  country: z.string().trim().length(2),
  email,
  name,
  registrantEmail: email,
  url: optionalHttpUrl(500).optional(),
})
