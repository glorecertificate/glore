import { type DefaultValues } from 'react-hook-form'

import { type PersonalField } from '@/components/features/certificates/rules'
import {
  type CertificateEditValues,
  MAX_CERTIFICATE_TASKS,
  MAX_DURATION_HOURS,
  MAX_EVIDENCE_LENGTH,
  MAX_RATING_COMMENT_LENGTH,
  MAX_TASK_LENGTH,
  type WizardValues,
  wizardSchema,
} from '@/components/features/certificates/schemas'
import { type Certificate } from '@/db/queries/certificate'
import { type IntlRecord } from '@/lib/i18n'

export type WizardDraft = DefaultValues<WizardValues>

export interface SkillOption {
  icon: string | null
  id: number
  reflection: string | null
  selfLevel: number | null
  slug: string
  title: IntlRecord | null
}

export interface HolderProfile {
  birthPlace: string | null
  birthday: string | null
  lastName: string | null
  nationality: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

const isLevel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5

export const emptyWizardValues = (language: string, holder: HolderProfile): WizardDraft => ({
  activityDuration: undefined,
  activityEndDate: '',
  activityLocation: '',
  activityStartDate: '',
  language,
  personal: {
    birthPlace: holder.birthPlace ?? '',
    birthday: holder.birthday ?? '',
    lastName: holder.lastName ?? '',
    nationality: holder.nationality ?? '',
  },
  rating: {
    certificationSupport: undefined,
    comment: '',
    experience: undefined,
    support: undefined,
    wouldRecommend: undefined,
  },
  skills: [],
  tasks: [{ text: '' }],
})

export const certificateWizardValues = (
  certificate: Certificate,
  base: WizardDraft,
  options: SkillOption[]
): WizardDraft => {
  const selfLevels = new Map(options.map(({ id, selfLevel }) => [id, selfLevel]))
  return {
    ...base,
    activityDuration: certificate.activityDuration > 0 ? certificate.activityDuration : undefined,
    activityEndDate: certificate.activityEndDate,
    activityLocation: certificate.activityLocation,
    activityStartDate: certificate.activityStartDate,
    language: certificate.language,
    rating: {
      certificationSupport: certificate.rating?.certificationSupport ?? undefined,
      comment: certificate.rating?.comment ?? '',
      experience: certificate.rating?.experience ?? undefined,
      support: certificate.rating?.support ?? undefined,
      wouldRecommend: certificate.rating?.wouldRecommend ?? undefined,
    },
    skills: certificate.skills
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(skill => ({
        courseId: skill.course.id,
        evidence: skill.evidence ?? '',
        selfLevel: skill.selfLevel ?? selfLevels.get(skill.course.id) ?? undefined,
      })) as WizardDraft['skills'],
    tasks: certificate.tasks.length > 0 ? certificate.tasks.map(text => ({ text })) : [{ text: '' }],
  }
}

export const toEditValues = (values: WizardDraft): CertificateEditValues => {
  const duration = Number(values.activityDuration)
  const rating = values.rating
  return {
    activityDuration: Number.isInteger(duration) && duration > 0 ? Math.min(duration, MAX_DURATION_HOURS) : 0,
    activityEndDate: ISO_DATE.test(values.activityEndDate ?? '') ? values.activityEndDate : '',
    activityLocation: (values.activityLocation ?? '').trim().slice(0, 255),
    activityStartDate: ISO_DATE.test(values.activityStartDate ?? '') ? values.activityStartDate : '',
    language: values.language,
    rating: {
      certificationSupport: isLevel(rating?.certificationSupport) ? rating.certificationSupport : null,
      comment: (rating?.comment ?? '').trim().slice(0, MAX_RATING_COMMENT_LENGTH) || null,
      experience: isLevel(rating?.experience) ? rating.experience : null,
      support: isLevel(rating?.support) ? rating.support : null,
      wouldRecommend: typeof rating?.wouldRecommend === 'boolean' ? rating.wouldRecommend : null,
    },
    skills: (values.skills ?? []).flatMap(skill =>
      skill?.courseId
        ? [
            {
              courseId: skill.courseId,
              evidence: (skill.evidence ?? '').trim().slice(0, MAX_EVIDENCE_LENGTH) || null,
              selfLevel: isLevel(skill.selfLevel) ? skill.selfLevel : null,
            },
          ]
        : []
    ),
    tasks: (values.tasks ?? [])
      .flatMap(task => {
        const text = (task?.text ?? '').trim().slice(0, MAX_TASK_LENGTH)
        return text ? [text] : []
      })
      .slice(0, MAX_CERTIFICATE_TASKS),
  }
}

export const WIZARD_STEP_FIELDS = [
  ['activityStartDate', 'activityEndDate', 'activityDuration', 'activityLocation', 'tasks'],
  ['skills'],
  ['rating'],
  ['language', 'personal'],
] as const

export const resumeStep = (values: WizardDraft, missing: readonly PersonalField[] = []) => {
  const issues = wizardSchema(missing).safeParse(values).error?.issues ?? []
  const fields = new Set(issues.map(issue => String(issue.path[0])))
  const index = WIZARD_STEP_FIELDS.findIndex(step => step.some(field => fields.has(field)))
  return index === -1 ? WIZARD_STEP_FIELDS.length - 1 : index
}
