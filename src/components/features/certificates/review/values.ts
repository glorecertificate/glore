import { type DefaultValues } from 'react-hook-form'

import { type HolderCourseResult } from '@/actions/certificates/queries'
import {
  type CertificateApprovalValues,
  type CertificateChangesValues,
  type ReviewFormValues,
} from '@/components/features/certificates/schemas'
import { type Certificate } from '@/db/queries/certificate'

export type ReviewDraft = DefaultValues<ReviewFormValues>

export const reviewDefaults = (certificate: Certificate, results: Record<number, HolderCourseResult>): ReviewDraft => ({
  activityDuration: certificate.activityDuration,
  activityEndDate: certificate.activityEndDate,
  activityLocation: certificate.activityLocation,
  activityStartDate: certificate.activityStartDate,
  comment: '',
  scores: { engagement: undefined, evidence: undefined, growth: undefined, reflection: undefined },
  sectionComments: { experience: '', personal: '', skills: '', tasks: '' },
  skills: certificate.skills
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map(skill => ({
      courseId: skill.course.id,
      include: true,
      level: results[skill.course.id]?.pick ?? results[skill.course.id]?.level ?? undefined,
    })),
  tasks: certificate.tasks.map(text => ({ text })),
})

export const approvalPayload = (values: ReviewFormValues): CertificateApprovalValues => ({
  activityDuration: values.activityDuration,
  activityEndDate: values.activityEndDate,
  activityLocation: values.activityLocation,
  activityStartDate: values.activityStartDate,
  comment: values.comment,
  scores: values.scores,
  skills: values.skills.flatMap(({ courseId, include, level }) => (include ? [{ courseId, level }] : [])),
  tasks: values.tasks.map(({ text }) => text),
})

export const changesPayload = (
  values: Pick<ReviewFormValues, 'comment' | 'sectionComments' | 'skills'>
): CertificateChangesValues => ({
  comment: values.comment,
  sectionComments: Object.fromEntries(Object.entries(values.sectionComments).filter(([, text]) => text.trim())),
  skills: values.skills.flatMap(({ courseId, level }) => (level ? [{ courseId, level }] : [])),
})

export const hasChangeRequest = (values: Pick<ReviewFormValues, 'comment' | 'sectionComments'>) =>
  Boolean(values.comment?.trim()) || Object.values(values.sectionComments ?? {}).some(text => text?.trim())
