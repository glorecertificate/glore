import { z } from 'zod'

import { LOCALES } from '@/lib/i18n'

export const APPLICATION_MOTIVATION_MIN = 20

export const APPLICATION_ERROR_CODES = ['charter', 'email', 'number', 'required', 'tooLong', 'tooShort', 'url'] as const

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number]

const required = (max: number) => z.string().trim().min(1, 'required').max(max, 'tooLong')

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'tooLong')
    .optional()
    .transform(value => value || null)

const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const email = z.string().trim().toLowerCase().min(1, 'required').pipe(z.email('email').max(254, 'tooLong'))

export const applicationSchema = z.object({
  charterAccepted: z.boolean().refine(value => value, 'charter'),
  city: required(100),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .refine(value => !value || z.email().safeParse(value).success, 'email')
    .optional()
    .transform(value => value || null),
  contactName: optional(150),
  country: z.string().trim().min(2, 'required').max(2, 'required'),
  email,
  firstName: required(100),
  lastName: required(100),
  legalName: required(200),
  locale: z.enum(LOCALES).optional(),
  motivation: z.string().trim().min(APPLICATION_MOTIVATION_MIN, 'tooShort').max(2000, 'tooLong'),
  name: required(150),
  registrantEmail: email,
  registryId: required(60),
  url: z
    .string()
    .trim()
    .max(500, 'tooLong')
    .refine(value => !value || isHttpUrl(value), 'url')
    .optional()
    .transform(value => value || null),
  volunteersPerYear: z
    .string()
    .trim()
    .min(1, 'required')
    .regex(/^\d{1,6}$/u, 'number')
    .transform(Number)
    .refine(value => value >= 1, 'number'),
})

export type ApplicationInput = z.input<typeof applicationSchema>
export type ApplicationValues = z.output<typeof applicationSchema>

export const APPLICATION_STEPS = ['organization', 'representative', 'motivation', 'charter'] as const

export type ApplicationStep = (typeof APPLICATION_STEPS)[number]

export const APPLICATION_STEP_FIELDS = {
  charter: ['charterAccepted'],
  motivation: ['motivation'],
  organization: ['name', 'legalName', 'registryId', 'country', 'city', 'email', 'url', 'volunteersPerYear'],
  representative: ['firstName', 'lastName', 'registrantEmail', 'contactName', 'contactEmail'],
} as const satisfies Record<ApplicationStep, (keyof ApplicationInput)[]>

export const applicationHandle = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60) || 'organization'
