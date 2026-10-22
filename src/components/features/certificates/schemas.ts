import { z } from 'zod'

import { type PersonalField } from '@/components/features/certificates/rules'
import { LOCALES } from '@/lib/i18n'
import appConfig from '~/config/app.json'

export const MAX_DURATION_HOURS = 8760

export const CERTIFICATE_SECTIONS = ['experience', 'personal', 'skills', 'tasks'] as const

export const MAX_CERTIFICATE_TASKS = 4
export const MAX_TASK_LENGTH = 110
export const MAX_STATEMENT_LENGTH = 200
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

export const MAX_EVIDENCE_LENGTH = 1000
export const MAX_RATING_COMMENT_LENGTH = 400

const formLevel = z.number({ message: 'required' }).int('required').min(1, 'required').max(5, 'required')

export const wizardSchema = (missing: readonly PersonalField[] = []) =>
  z
    .object({
      activityDuration: z
        .number({ message: 'required' })
        .int('invalidNumber')
        .min(1, 'invalidNumber')
        .max(MAX_DURATION_HOURS, 'invalidNumber'),
      activityEndDate: z.iso.date({ message: 'required' }),
      activityLocation: z.string().trim().min(1, 'required').max(255, 'tooLong'),
      activityStartDate: z.iso.date({ message: 'required' }),
      language,
      personal: z.object({
        birthPlace: z.string().trim().max(100, 'tooLong'),
        birthday: z.string(),
        lastName: z.string().trim().max(100, 'tooLong'),
        nationality: z.string().trim().max(2, 'required'),
      }),
      rating: z.object({
        certificationSupport: formLevel.nullish(),
        comment: z.string().trim().max(MAX_RATING_COMMENT_LENGTH, 'tooLong').nullish(),
        experience: formLevel,
        support: formLevel.nullish(),
        wouldRecommend: z.boolean().nullish(),
      }),
      skills: z
        .array(
          z.object({
            courseId: z.number().int().positive(),
            evidence: z.string().trim().max(MAX_EVIDENCE_LENGTH, 'tooLong'),
            selfLevel: formLevel,
          })
        )
        .min(appConfig.minSkills, 'minSkills')
        .max(appConfig.maxSkills, 'maxSkills'),
      tasks: z
        .array(z.object({ text: z.string().trim().min(1, 'required').max(MAX_TASK_LENGTH, 'tooLong') }))
        .min(1, 'required')
        .max(MAX_CERTIFICATE_TASKS, 'tooLong'),
    })
    .superRefine((values, context) => {
      if (values.activityEndDate < values.activityStartDate) {
        context.addIssue({ code: 'custom', message: 'endBeforeStart', path: ['activityEndDate'] })
      }
      for (const field of missing) {
        if (field === 'birthday' && !/^\d{4}-\d{2}-\d{2}$/u.test(values.personal.birthday)) {
          context.addIssue({ code: 'custom', message: 'required', path: ['personal', field] })
          continue
        }
        if (field === 'nationality' && !/^[A-Za-z]{2}$/u.test(values.personal.nationality)) {
          context.addIssue({ code: 'custom', message: 'required', path: ['personal', field] })
          continue
        }
        if (!values.personal[field].trim()) {
          context.addIssue({ code: 'custom', message: 'required', path: ['personal', field] })
        }
      }
    })

export type WizardValues = z.infer<ReturnType<typeof wizardSchema>>

const MAX_SECTION_COMMENT_LENGTH = 1000
const MAX_REVIEW_COMMENT_LENGTH = 2000

const sectionField = z.string().trim().max(MAX_SECTION_COMMENT_LENGTH, 'tooLong')

export const reviewFormSchema = z
  .object({
    activityDuration: z
      .number({ message: 'required' })
      .int('invalidNumber')
      .min(1, 'invalidNumber')
      .max(MAX_DURATION_HOURS, 'invalidNumber'),
    activityEndDate: z.iso.date({ message: 'required' }),
    activityLocation: z.string().trim().min(1, 'required').max(255, 'tooLong'),
    activityStartDate: z.iso.date({ message: 'required' }),
    comment: z.string().trim().max(MAX_REVIEW_COMMENT_LENGTH, 'tooLong'),
    scores: z.object({
      engagement: formLevel,
      evidence: formLevel,
      growth: formLevel,
      reflection: formLevel,
    }),
    sectionComments: z.object({
      experience: sectionField,
      personal: sectionField,
      skills: sectionField,
      tasks: sectionField,
    }),
    skills: z.array(
      z.object({
        courseId: z.number().int().positive(),
        include: z.boolean(),
        level: z.number().int().min(1).max(5).optional(),
        statement: z.string().trim().max(MAX_STATEMENT_LENGTH, 'tooLong'),
      })
    ),
    tasks: z
      .array(z.object({ text: z.string().trim().min(1, 'required').max(MAX_TASK_LENGTH, 'tooLong') }))
      .min(1, 'required')
      .max(MAX_CERTIFICATE_TASKS, 'tooLong'),
  })
  .superRefine((values, context) => {
    if (values.activityEndDate < values.activityStartDate) {
      context.addIssue({ code: 'custom', message: 'endBeforeStart', path: ['activityEndDate'] })
    }
    const included = values.skills.filter(({ include }) => include).length
    if (included < appConfig.minSkills) context.addIssue({ code: 'custom', message: 'minSkills', path: ['skills'] })
    if (included > appConfig.maxSkills) context.addIssue({ code: 'custom', message: 'maxSkills', path: ['skills'] })
    for (const [index, skill] of values.skills.entries()) {
      if (skill.include && !(skill.level && skill.level >= MIN_ISSUED_LEVEL)) {
        context.addIssue({ code: 'custom', message: 'levelRequired', path: ['skills', index, 'level'] })
      }
    }
  })

export type ReviewFormValues = z.infer<typeof reviewFormSchema>
