import { type DefaultValues } from 'react-hook-form'

import {
  type CertificateApprovalValues,
  type CertificateChangesValues,
  MIN_ISSUED_LEVEL,
  type ReviewFormValues,
} from '@/components/features/certificates/schemas'
import { type Certificate } from '@/db/queries/certificate'

export type ReviewDraft = DefaultValues<ReviewFormValues>

export const reviewDefaults = (certificate: Certificate): ReviewDraft => ({
  activityDuration: certificate.activityDuration,
  activityEndDate: certificate.activityEndDate,
  activityLocation: certificate.activityLocation,
  activityStartDate: certificate.activityStartDate,
  comment: '',
  scores: { engagement: undefined, evidence: undefined, growth: undefined, reflection: undefined },
  sectionComments: { experience: '', personal: '', skills: '', tasks: '' },
  skills: certificate.skills
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map(skill => {
      const level = skill.level ?? skill.selfLevel ?? undefined
      return {
        courseId: skill.course.id,
        include: true,
        level: level && level >= MIN_ISSUED_LEVEL ? level : undefined,
        statement: skill.statement ?? '',
      }
    }),
  tasks: certificate.tasks.map(text => ({ text })),
})

export const approvalPayload = (values: ReviewFormValues): CertificateApprovalValues => ({
  activityDuration: values.activityDuration,
  activityEndDate: values.activityEndDate,
  activityLocation: values.activityLocation,
  activityStartDate: values.activityStartDate,
  comment: values.comment,
  scores: values.scores,
  skills: values.skills.flatMap(({ courseId, include, level, statement }) =>
    include ? [{ courseId, level, statement: statement || null }] : []
  ),
  tasks: values.tasks.map(({ text }) => text),
})

export const changesPayload = (
  values: Pick<ReviewFormValues, 'comment' | 'sectionComments'>
): CertificateChangesValues => ({
  comment: values.comment,
  sectionComments: Object.fromEntries(Object.entries(values.sectionComments).filter(([, text]) => text.trim())),
})

export const hasChangeRequest = (values: Pick<ReviewFormValues, 'comment' | 'sectionComments'>) =>
  Boolean(values.comment?.trim()) || Object.values(values.sectionComments ?? {}).some(text => text?.trim())
