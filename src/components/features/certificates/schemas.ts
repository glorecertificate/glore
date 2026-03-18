import { z } from 'zod'

export const certificateFormSchema = z
  .object({
    activityStartDate: z.string().min(1),
    activityEndDate: z.string().min(1),
    activityDuration: z.coerce.number().int().positive(),
    activityLocation: z.string().min(1).max(255),
    activityDescription: z.string().min(10).max(2000),
    organizationRating: z.coerce.number().int().min(1).max(5),
    language: z.string().min(1),
    skillCourseIds: z.array(z.number()).min(1),
  })
  .refine(data => new Date(data.activityEndDate) >= new Date(data.activityStartDate), {
    path: ['activityEndDate'],
    message: 'End date must be after start date',
  })

export type CertificateFormValues = z.infer<typeof certificateFormSchema>

const reviewActivitySchema = z.object({
  activityStartDate: z.string().optional(),
  activityEndDate: z.string().optional(),
  activityDuration: z.coerce.number().int().positive().optional(),
  activityLocation: z.string().max(255).optional(),
  activityDescription: z.string().max(2000).optional(),
  skillCourseIds: z.array(z.number()).optional(),
})

export const reviewCertificateSchema = z.discriminatedUnion('action', [
  reviewActivitySchema.extend({ action: z.literal('approve') }),
  reviewActivitySchema.extend({ action: z.literal('request_changes'), comment: z.string().min(10).max(2000) }),
])

export type ReviewCertificateValues = z.infer<typeof reviewCertificateSchema>
