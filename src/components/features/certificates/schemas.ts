import { z } from 'zod'

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
  })
  .refine(data => new Date(data.activityEndDate) >= new Date(data.activityStartDate), {
    path: ['activityEndDate'],
    message: 'End date must be after start date',
  })

export type CertificateFormValues = z.infer<typeof certificateFormSchema>

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
