import { z } from 'zod'

import { LOCALES } from '@/lib/i18n'
import appConfig from '~/config/app.json'

const MAX_DURATION_HOURS = 8760

export const certificateFormSchema = z
  .object({
    activityStartDate: z.string().min(1, 'Start date is required'),
    activityEndDate: z.string().min(1, 'End date is required'),
    activityDuration: z.coerce
      .number({ message: 'Duration is required' })
      .int('Duration must be a whole number')
      .positive('Duration must be at least 1 hour')
      .max(MAX_DURATION_HOURS, `Duration cannot exceed ${MAX_DURATION_HOURS.toLocaleString()} hours`),
    activityLocation: z.string().min(1, 'Location is required').max(255, 'Location must be at most 255 characters'),
    activityDescription: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be at most 2,000 characters'),
    organizationRating: z.coerce.number().int().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
    language: z.string().min(1, 'Language is required'),
    skillCourseIds: z.array(z.number()).min(appConfig.minSkills, `Select at least ${appConfig.minSkills} skills`),
    nationality: z.string().optional().default(''),
    birthPlace: z.string().optional().default(''),
  })
  .refine(data => new Date(data.activityEndDate) >= new Date(data.activityStartDate), {
    path: ['activityEndDate'],
    message: 'End date must be after start date',
  })

export type CertificateFormValues = z.infer<typeof certificateFormSchema>

export const draftCertificateSchema = z.object({
  activityStartDate: z.string().optional().default(''),
  activityEndDate: z.string().optional().default(''),
  activityDuration: z.coerce.number().int().nonnegative().max(MAX_DURATION_HOURS).optional().default(0),
  activityLocation: z.string().max(255).optional().default(''),
  activityDescription: z.string().max(2000).optional().default(''),
  organizationRating: z.coerce.number().int().min(0).max(5).optional().default(0),
  language: z.string().min(1, 'Language is required'),
  skillCourseIds: z.array(z.number()).optional().default([]),
  nationality: z.string().optional().default(''),
  birthPlace: z.string().optional().default(''),
})

export type DraftCertificateValues = z.infer<typeof draftCertificateSchema>

const reviewActivitySchema = z.object({
  activityStartDate: z.string().optional(),
  activityEndDate: z.string().optional(),
  activityDuration: z.number().int().positive('Duration must be at least 1 hour').optional(),
  activityLocation: z.string().max(255, 'Location must be at most 255 characters').optional(),
  activityDescription: z.string().max(2000, 'Description must be at most 2,000 characters').optional(),
  skillCourseIds: z.array(z.number()).optional(),
})

export const reviewCertificateSchema = z.discriminatedUnion('action', [
  reviewActivitySchema.extend({ action: z.literal('approve') }),
  reviewActivitySchema.extend({
    action: z.literal('request_changes'),
    comment: z
      .string()
      .min(10, 'Feedback must be at least 10 characters')
      .max(2000, 'Feedback must be at most 2,000 characters'),
  }),
])

export type ReviewCertificateValues = z.infer<typeof reviewCertificateSchema>

export const resubmitCertificateSchema = z
  .object({
    activityStartDate: z.string().min(1, 'Start date is required'),
    activityEndDate: z.string().min(1, 'End date is required'),
    activityDuration: z.coerce
      .number({ message: 'Duration is required' })
      .int('Duration must be a whole number')
      .positive('Duration must be at least 1 hour')
      .max(MAX_DURATION_HOURS, `Duration cannot exceed ${MAX_DURATION_HOURS.toLocaleString()} hours`),
    activityLocation: z.string().min(1, 'Location is required').max(255, 'Location must be at most 255 characters'),
    activityDescription: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be at most 2,000 characters'),
  })
  .refine(data => new Date(data.activityEndDate) >= new Date(data.activityStartDate), {
    path: ['activityEndDate'],
    message: 'End date must be after start date',
  })

export type ResubmitCertificateValues = z.infer<typeof resubmitCertificateSchema>

const CERTIFICATE_SECTIONS = ['experience', 'personal', 'skills', 'tasks'] as const

export const MAX_CERTIFICATE_TASKS = 4
export const MAX_TASK_LENGTH = 110
const MAX_STATEMENT_LENGTH = 200
export const MIN_ISSUED_LEVEL = 2

const isoDate = z.iso.date()
const level = z.number().int().min(1).max(5)
const language = z.string().refine(value => (LOCALES as string[]).includes(value), 'Unsupported language')
const reason = z.string().trim().min(10).max(2000)

const taskSchema = z.string().trim().min(1).max(MAX_TASK_LENGTH)

const skillSchema = z.object({
  courseId: z.number().int().positive(),
  evidence: z.string().trim().max(1000).nullish(),
  selfLevel: level.nullish(),
})

const ratingSchema = z.object({
  certificationSupport: level.nullish(),
  comment: z.string().trim().max(400).nullish(),
  experience: level.nullish(),
  support: level.nullish(),
  wouldRecommend: z.boolean().nullish(),
})

const experienceShape = {
  activityDescription: z.string().trim().max(2000),
  activityDuration: z.number().int().min(1).max(MAX_DURATION_HOURS),
  activityEndDate: isoDate,
  activityLocation: z.string().trim().min(1).max(255),
  activityStartDate: isoDate,
  language,
  tasks: z.array(taskSchema).max(MAX_CERTIFICATE_TASKS),
}

export const certificateEditSchema = z
  .object({
    ...experienceShape,
    activityDuration: z.number().int().min(0).max(MAX_DURATION_HOURS),
    activityEndDate: isoDate.or(z.literal('')),
    activityLocation: z.string().trim().max(255),
    activityStartDate: isoDate.or(z.literal('')),
    rating: ratingSchema,
    skills: z.array(skillSchema).max(appConfig.maxSkills),
  })
  .partial()

export const certificateRequestSchema = z
  .object({
    ...experienceShape,
    rating: ratingSchema.extend({ experience: level }),
    skills: z.array(skillSchema).min(appConfig.minSkills).max(appConfig.maxSkills),
    tasks: z.array(taskSchema).min(1).max(MAX_CERTIFICATE_TASKS),
  })
  .refine(data => data.activityEndDate >= data.activityStartDate, { path: ['activityEndDate'] })
  .refine(data => new Set(data.skills.map(({ courseId }) => courseId)).size === data.skills.length, {
    path: ['skills'],
  })

export const personalDataSchema = z.object({
  birthPlace: z.string().trim().min(1).max(100).optional(),
  birthday: isoDate.optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  nationality: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/u)
    .toLowerCase()
    .optional(),
})

export const certificateApprovalSchema = z.object({
  activityDescription: experienceShape.activityDescription.optional(),
  activityDuration: experienceShape.activityDuration.optional(),
  activityEndDate: isoDate.optional(),
  activityLocation: experienceShape.activityLocation.optional(),
  activityStartDate: isoDate.optional(),
  comment: z.string().trim().max(2000).optional(),
  scores: z.object({ engagement: level, evidence: level, growth: level, reflection: level }).optional(),
  skills: z
    .array(
      z.object({
        courseId: z.number().int().positive(),
        level: z.number().int().min(MIN_ISSUED_LEVEL).max(5).optional(),
        statement: z.string().trim().max(MAX_STATEMENT_LENGTH).nullish(),
      })
    )
    .max(appConfig.maxSkills)
    .optional(),
  tasks: z.array(taskSchema).min(1).max(MAX_CERTIFICATE_TASKS).optional(),
})

const sectionComment = z.string().trim().max(1000)

export const certificateChangesSchema = z
  .object({
    comment: z.string().trim().max(2000).optional(),
    sectionComments: z.partialRecord(z.enum(CERTIFICATE_SECTIONS), sectionComment).optional(),
  })
  .refine(data => Boolean(data.comment) || Object.values(data.sectionComments ?? {}).some(Boolean), {
    path: ['comment'],
  })

export const certificateReasonSchema = z.object({ reason })

export type CertificateEditValues = z.infer<typeof certificateEditSchema>
export type CertificateRequestValues = z.infer<typeof certificateRequestSchema>
export type PersonalDataValues = z.infer<typeof personalDataSchema>
export type CertificateApprovalValues = z.infer<typeof certificateApprovalSchema>
export type CertificateChangesValues = z.infer<typeof certificateChangesSchema>
export type CertificateReasonValues = z.infer<typeof certificateReasonSchema>
