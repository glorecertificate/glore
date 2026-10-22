import { type CertificateEditValues } from '@/components/features/certificates/schemas'
import appConfig from '~/config/app.json'

const DAY_MS = 86_400_000

const DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/u

const toUtc = (date: string) => {
  const [, year = '0', month = '1', day = '1'] = DATE_PARTS.exec(date) ?? []
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

const toIsoDate = (time: number) => new Date(time).toISOString().slice(0, 10)

export const addMonths = (date: string, months: number) => {
  const start = new Date(toUtc(date))
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay))
  return toIsoDate(target.getTime())
}

interface ActivityPeriod {
  activityDuration: number
  activityEndDate: string
  activityStartDate: string
}

interface ActivityConfig {
  minActivityHours: number
  minActivityMonths: number
}

export const meetsActivityRule = (
  { activityDuration, activityEndDate, activityStartDate }: ActivityPeriod,
  { minActivityHours, minActivityMonths }: ActivityConfig = appConfig
) => {
  if (activityDuration >= minActivityHours) return true
  if (!(DATE_PARTS.test(activityStartDate) && DATE_PARTS.test(activityEndDate))) return false
  const lastDay = toUtc(addMonths(activityStartDate, minActivityMonths)) - DAY_MS
  return toUtc(activityEndDate) >= lastDay
}

export interface TutorLoad {
  lastAssignedAt: string | null
  openRequests: number
  userId: string
}

const compareAssignment = (a: string | null, b: string | null) => {
  if (a === b) return 0
  if (a === null) return -1
  if (b === null) return 1
  return a < b ? -1 : 1
}

const compareTutorLoad = (a: TutorLoad, b: TutorLoad) =>
  a.openRequests - b.openRequests ||
  compareAssignment(a.lastAssignedAt, b.lastAssignedAt) ||
  a.userId.localeCompare(b.userId)

export const chooseTutor = (loads: TutorLoad[]) => loads.toSorted(compareTutorLoad)[0]?.userId ?? null

interface PersonalData {
  birthPlace?: string | null
  birthday?: string | null
  lastName?: string | null
  nationality?: string | null
}

const PERSONAL_FIELDS = ['lastName', 'birthday', 'birthPlace', 'nationality'] as const

export const missingPersonalData = (holder: PersonalData) => PERSONAL_FIELDS.filter(field => !holder[field]?.trim())

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const generateCertificateCode = () => {
  const chars = [...crypto.getRandomValues(new Uint8Array(12))].map(byte => CROCKFORD[byte % 32])
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map(group => group.join('')).join('-')
}

interface StoredCertificate {
  activityDescription: string
  activityDuration: number
  activityEndDate: string
  activityLocation: string
  activityStartDate: string
  language: string
  rating: {
    certificationSupport: number | null
    comment: string | null
    experience: number | null
    support: number | null
    wouldRecommend: boolean | null
  } | null
  skills: { courseId: number; evidence: string | null; selfLevel: number | null; sortOrder: number }[]
  tasks: string[]
}

export const mergeCertificateValues = (stored: StoredCertificate, edit: CertificateEditValues) => ({
  activityDescription: edit.activityDescription ?? stored.activityDescription,
  activityDuration: edit.activityDuration ?? stored.activityDuration,
  activityEndDate: edit.activityEndDate ?? stored.activityEndDate,
  activityLocation: edit.activityLocation ?? stored.activityLocation,
  activityStartDate: edit.activityStartDate ?? stored.activityStartDate,
  language: edit.language ?? stored.language,
  rating: {
    certificationSupport: stored.rating?.certificationSupport,
    comment: stored.rating?.comment,
    experience: stored.rating?.experience,
    support: stored.rating?.support,
    wouldRecommend: stored.rating?.wouldRecommend,
    ...edit.rating,
  },
  skills:
    edit.skills ??
    stored.skills
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(({ courseId, evidence, selfLevel }) => ({ courseId, evidence, selfLevel })),
  tasks: edit.tasks ?? stored.tasks,
})
