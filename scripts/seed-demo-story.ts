import { createHash } from 'node:crypto'

import {
  type DemoLocale,
  EXPERIENCES,
  INVITATION_MESSAGES,
  JOIN_REQUEST_MESSAGES,
  RATING_COMMENTS,
  REFLECTIONS,
  REVIEW_COMMENTS,
  SKILL_TEXTS,
} from './seed-demo-copy.ts'
import { DAY_MS, DEMO_ORGANIZATIONS, DEMO_USERS, ago } from './seed-demo-data.ts'

type DemoStatus =
  | 'approved'
  | 'changes_requested'
  | 'draft'
  | 'in_review'
  | 'rejected'
  | 'revoked'
  | 'submitted'
  | 'withdrawn'

interface DemoSkill {
  course: string
  selfLevel: number
  level?: number
}

type DemoRatingTuple = [experience: number, support: number, certification: number, recommend: boolean]

interface CertificateSeed {
  key: string
  holder: string | null
  organization: string
  status: DemoStatus
  reviewer: string | null
  experience: string
  skills: DemoSkill[]
  submitted: number
  decided?: number
  closed?: number
  revokedBy?: string
  assignedAtSubmit?: string
  changesFirst?: boolean
  escalated?: boolean
  unassigned?: number
  deleted?: number
  rating?: DemoRatingTuple
}

const skill = (course: string, selfLevel: number, level?: number): DemoSkill => ({ course, selfLevel, level })

export const FORMER_HOLDER = {
  birthPlace: 'Bologna',
  birthday: '1999-04-18',
  firstName: 'Sofia',
  lastName: 'Ferraresi',
  nationality: 'IT',
} as const

const CERTIFICATE_SEEDS: CertificateSeed[] = [
  {
    key: 'volunteer-approved',
    holder: 'volunteer',
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor',
    experience: 'food-bank',
    skills: [skill('team-work', 4), skill('communication-and-active-listening', 3), skill('responsibility', 4)],
    submitted: 48,
    decided: 45,
    rating: [5, 5, 4, true],
  },
  {
    key: 'volunteer-draft',
    holder: 'volunteer',
    organization: 'ponte',
    status: 'draft',
    reviewer: null,
    experience: 'food-bank-draft',
    skills: [skill('initiative', 3), skill('communication-and-active-listening', 3), skill('responsibility', 4)],
    submitted: 3,
  },
  {
    key: 'review',
    holder: 'volunteer-review',
    organization: 'ponte',
    status: 'submitted',
    reviewer: 'tutor',
    experience: 'after-school',
    skills: [skill('empathy', 4), skill('self-awareness', 3), skill('flexibility', 4)],
    submitted: 2,
    rating: [5, 4, 4, true],
  },
  {
    key: 'changes',
    holder: 'volunteer-changes',
    organization: 'ponte',
    status: 'changes_requested',
    reviewer: 'tutor',
    experience: 'welcome-desk',
    skills: [skill('conflict-management', 3), skill('communication-and-active-listening', 4), skill('team-work', 4)],
    submitted: 9,
    decided: 2,
    rating: [4, 4, 3, true],
  },
  {
    key: 'member-01-review',
    holder: 'member-01',
    organization: 'ponte',
    status: 'in_review',
    reviewer: 'tutor',
    experience: 'youth-centre',
    skills: [skill('team-work', 4), skill('initiative', 4), skill('problem-solving', 3)],
    submitted: 9,
    escalated: true,
    rating: [4, 5, 5, true],
  },
  {
    key: 'member-02-assigned',
    holder: 'member-02',
    organization: 'ponte',
    status: 'submitted',
    reviewer: 'tutor2',
    experience: 'community-garden',
    skills: [skill('responsibility', 4), skill('organization-and-time-management', 3), skill('flexibility', 3)],
    submitted: 1,
    rating: [4, 3, 4, true],
  },
  {
    key: 'member-03-approved',
    holder: 'member-03',
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor2',
    experience: 'senior-visits',
    skills: [skill('empathy', 5, 4), skill('communication-and-active-listening', 4), skill('team-work', 4)],
    submitted: 30,
    decided: 25,
    changesFirst: true,
    rating: [5, 5, 5, true],
  },
  {
    key: 'member-04-rejected',
    holder: 'member-04',
    organization: 'ponte',
    status: 'rejected',
    reviewer: 'tutor',
    experience: 'language-cafe',
    skills: [skill('initiative', 3), skill('problem-solving', 3), skill('flexibility', 3)],
    submitted: 14,
    decided: 12,
    rating: [3, 3, 3, false],
  },
  {
    key: 'member-05-withdrawn',
    holder: 'member-05',
    organization: 'ponte',
    status: 'withdrawn',
    reviewer: 'tutor',
    experience: 'sports-camp',
    skills: [skill('team-work', 3), skill('responsibility', 3), skill('empathy', 4)],
    submitted: 16,
    closed: 15,
    rating: [4, 4, 4, true],
  },
  {
    key: 'member-06-approved',
    holder: 'member-06',
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor2',
    experience: 'repair-cafe',
    skills: [
      skill('problem-solving', 4),
      skill('organization-and-time-management', 3),
      skill('initiative', 4),
      skill('team-work', 4),
    ],
    submitted: 72,
    decided: 70,
    rating: [4, 4, 4, true],
  },
  {
    key: 'member-07-approved',
    holder: 'member-07',
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor2',
    experience: 'library',
    skills: [skill('self-awareness', 4), skill('communication-and-active-listening', 4), skill('responsibility', 5)],
    submitted: 102,
    decided: 100,
    rating: [5, 4, 5, true],
  },
  {
    key: 'member-08-approved',
    holder: 'member-08',
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor2',
    experience: 'city-parks',
    skills: [skill('team-work', 4), skill('organization-and-time-management', 4), skill('problem-solving', 3)],
    submitted: 137,
    decided: 135,
    rating: [4, 5, 4, true],
  },
  {
    key: 'member-09-unassigned',
    holder: 'member-09',
    organization: 'ponte',
    status: 'submitted',
    reviewer: null,
    experience: 'italian-school',
    skills: [skill('empathy', 4), skill('communication-and-active-listening', 4), skill('flexibility', 3)],
    submitted: 3,
    assignedAtSubmit: 'tutor',
    unassigned: 1.5,
    rating: [5, 4, 4, true],
  },
  {
    key: 'member-10-revoked',
    holder: 'member-10',
    organization: 'ponte',
    status: 'revoked',
    reviewer: 'tutor2',
    experience: 'soup-kitchen',
    skills: [skill('responsibility', 4), skill('team-work', 4), skill('initiative', 3)],
    submitted: 95,
    decided: 90,
    closed: 20,
    revokedBy: 'owner',
    rating: [4, 3, 3, true],
  },
  {
    key: 'former-holder',
    holder: null,
    organization: 'ponte',
    status: 'approved',
    reviewer: 'tutor2',
    experience: 'food-appeal',
    skills: [skill('team-work', 4), skill('empathy', 4), skill('flexibility', 3)],
    submitted: 165,
    decided: 160,
    deleted: 40,
    rating: [4, 4, 4, true],
  },
  {
    key: 'red-01-approved',
    holder: 'red-01',
    organization: 'red',
    status: 'approved',
    reviewer: 'multi',
    experience: 'valencia-food-bank',
    skills: [skill('empathy', 4), skill('responsibility', 4), skill('team-work', 5, 4)],
    submitted: 34,
    decided: 30,
    rating: [5, 5, 5, true],
  },
  {
    key: 'red-02-revoked',
    holder: 'red-02',
    organization: 'red',
    status: 'revoked',
    reviewer: 'multi',
    experience: 'elder-company',
    skills: [skill('communication-and-active-listening', 4), skill('empathy', 5, 4), skill('self-awareness', 3)],
    submitted: 75,
    decided: 70,
    closed: 15,
    revokedBy: 'owner-b',
    rating: [4, 4, 4, true],
  },
  {
    key: 'red-03-review',
    holder: 'red-03',
    organization: 'red',
    status: 'submitted',
    reviewer: 'multi',
    experience: 'school-support',
    skills: [skill('team-work', 4), skill('problem-solving', 3), skill('initiative', 4)],
    submitted: 4,
    rating: [5, 4, 4, true],
  },
]

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const demoHandle = (key: string) => `demo-${key}`

export const demoCode = (handle: string) => {
  const bytes = createHash('sha256').update(handle).digest()
  const chars = Array.from({ length: 12 }, (_, index) => CROCKFORD[(bytes[index] ?? 0) % 32])
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map(group => group.join('')).join('-')
}

const isoDate = (iso: string) => iso.slice(0, 10)

const shiftMonths = (iso: string, months: number) => {
  const date = new Date(iso)
  date.setUTCMonth(date.getUTCMonth() - months)
  return date.toISOString()
}

interface PlannedReview {
  at: string
  reviewer: string
  decision: 'approved' | 'changes_requested' | 'rejected'
  comment: string | null
  sections: Partial<Record<'experience' | 'personal' | 'skills' | 'tasks', string>>
  scores: [number, number, number, number] | null
}

interface PlannedSkill {
  course: string
  selfLevel: number
  level: number | null
  evidence: string | null
  statement: string | null
  sortOrder: number
}

export interface PlannedCertificate {
  key: string
  handle: string
  code: string | null
  holder: string | null
  organization: string
  status: DemoStatus
  reviewer: string | null
  language: DemoLocale
  experience: string
  activity: {
    description: string
    duration: number
    endDate: string
    location: string
    startDate: string
    tasks: string[]
  }
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
  issuedAt: string | null
  withdrawnAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  revokedReason: string | null
  rejectedReason: string | null
  reviewerComment: string | null
  holderDeletedAt: string | null
  isDefault: boolean
  skills: PlannedSkill[]
  reviews: PlannedReview[]
  rating: {
    comment: string | null
    experience: number
    support: number
    certification: number
    recommend: boolean
  } | null
  seed: CertificateSeed
}

const SCORES: PlannedReview['scores'][] = [
  [4, 4, 3, 4],
  [5, 4, 4, 5],
  [3, 4, 4, 3],
  [4, 5, 4, 4],
]

const planCertificate = (seed: CertificateSeed, index: number, now: Date): PlannedCertificate => {
  const experience = EXPERIENCES[seed.experience]
  if (!experience) throw new Error(`Unknown experience ${seed.experience}`)
  const { language } = experience
  const issued = ['approved', 'revoked'].includes(seed.status)
  const draft = seed.status === 'draft'
  const handle = demoHandle(seed.key)
  const submittedAt = draft ? null : ago(now, seed.submitted)
  const endDate = isoDate(ago(now, seed.submitted + 6))
  const hasPeriod = experience.months > 0
  const decidedAt = seed.decided === undefined ? null : ago(now, seed.decided)
  const reviewerName = seed.reviewer ?? 'tutor'
  const reviews: PlannedReview[] = []

  if (seed.changesFirst) {
    reviews.push({
      at: ago(now, seed.submitted - 3),
      reviewer: reviewerName,
      decision: 'changes_requested',
      comment: 'Aggiungi un esempio concreto per la competenza empatia e controlla le date.',
      sections: { skills: 'Un esempio concreto aiuta a motivare il livello.' },
      scores: null,
    })
  }
  if (seed.status === 'approved' || seed.status === 'revoked') {
    reviews.push({
      at: decidedAt ?? ago(now, 1),
      reviewer: reviewerName,
      decision: 'approved',
      comment: REVIEW_COMMENTS.approved[language],
      sections: {},
      scores: SCORES[index % SCORES.length] ?? null,
    })
  }
  if (seed.status === 'changes_requested') {
    reviews.push({
      at: decidedAt ?? ago(now, 1),
      reviewer: reviewerName,
      decision: 'changes_requested',
      comment: REVIEW_COMMENTS.changes.comment,
      sections: { tasks: REVIEW_COMMENTS.changes.tasks, experience: REVIEW_COMMENTS.changes.experience },
      scores: null,
    })
  }
  if (seed.status === 'rejected') {
    reviews.push({
      at: decidedAt ?? ago(now, 1),
      reviewer: reviewerName,
      decision: 'rejected',
      comment: REVIEW_COMMENTS.rejected,
      sections: {},
      scores: null,
    })
  }

  const ratingComments = RATING_COMMENTS[language]
  const rating = seed.rating
    ? {
        comment: index % 3 === 2 ? null : (ratingComments[index % ratingComments.length] ?? null),
        experience: seed.rating[0],
        support: seed.rating[1],
        certification: seed.rating[2],
        recommend: seed.rating[3],
      }
    : null

  const skills = seed.skills.map((entry, sortOrder): PlannedSkill => {
    const text = SKILL_TEXTS[entry.course]
    if (!text) throw new Error(`Missing text for ${entry.course}`)
    return {
      course: entry.course,
      selfLevel: entry.selfLevel,
      level: issued ? (entry.level ?? entry.selfLevel) : null,
      evidence: text.evidence[language],
      statement: issued ? text.statement[language] : null,
      sortOrder,
    }
  })

  const revokedReason = seed.status === 'revoked' ? REVIEW_COMMENTS[language === 'es' ? 'revokedEs' : 'revoked'] : null

  return {
    key: seed.key,
    handle,
    code: draft ? null : demoCode(handle),
    holder: seed.holder,
    organization: seed.organization,
    status: seed.status,
    reviewer: seed.reviewer,
    language,
    experience: seed.experience,
    activity: {
      description: experience.description,
      duration: experience.hours,
      endDate: hasPeriod ? endDate : '',
      location: experience.location,
      startDate: hasPeriod ? isoDate(shiftMonths(ago(now, seed.submitted + 6), experience.months)) : '',
      tasks: experience.tasks,
    },
    createdAt: ago(now, seed.submitted + (draft ? 0 : 4)),
    submittedAt,
    reviewedAt: decidedAt,
    issuedAt: issued ? decidedAt : null,
    withdrawnAt: seed.status === 'withdrawn' && seed.closed !== undefined ? ago(now, seed.closed) : null,
    revokedAt: seed.status === 'revoked' && seed.closed !== undefined ? ago(now, seed.closed) : null,
    revokedBy: seed.status === 'revoked' ? (seed.revokedBy ?? null) : null,
    revokedReason,
    rejectedReason: seed.status === 'rejected' ? REVIEW_COMMENTS.rejected : null,
    reviewerComment: seed.status === 'changes_requested' ? REVIEW_COMMENTS.changes.comment : null,
    holderDeletedAt: seed.deleted === undefined ? null : ago(now, seed.deleted),
    isDefault: seed.status === 'approved' && seed.holder !== null,
    skills,
    reviews,
    rating,
    seed,
  }
}

export const planCertificates = (now: Date) => CERTIFICATE_SEEDS.map((seed, index) => planCertificate(seed, index, now))

export interface DemoCourseProgress {
  user: string
  course: string
  lessons: number | 'all'
  activityDaysAgo: number
  partialQuiz: boolean
  selfLevel: number
  rating: number | null
  reflection: string
}

const reflectionFor = (language: DemoLocale, seedIndex: number) => {
  const options = REFLECTIONS[language]
  return options[seedIndex % options.length] ?? ''
}

interface ExplicitProgress {
  user: string
  course: string
  lessons: number | 'all'
  activityDaysAgo: number
  partialQuiz?: boolean
  selfLevel?: number
  comment?: string
}

const EXPLICIT_PROGRESS: ExplicitProgress[] = [
  { user: 'volunteer', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 210 },
  { user: 'volunteer', course: 'soft-skills-and-volunteering', lessons: 'all', activityDaysAgo: 205 },
  { user: 'volunteer-progress', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 58 },
  { user: 'volunteer-progress', course: 'team-work', lessons: 'all', activityDaysAgo: 20, selfLevel: 4 },
  { user: 'volunteer-progress', course: 'self-awareness', lessons: 'all', activityDaysAgo: 9, selfLevel: 4 },
  {
    user: 'volunteer-progress',
    course: 'problem-solving',
    lessons: 2,
    activityDaysAgo: 1,
    partialQuiz: true,
    selfLevel: 3,
  },
  { user: 'volunteer-review', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 118 },
  { user: 'volunteer-changes', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 108 },
  { user: 'learner', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 40 },
  { user: 'learner', course: 'intercultural-learning', lessons: 'all', activityDaysAgo: 12 },
  { user: 'learner', course: 'volunteer-wellbeing-and-safety', lessons: 1, activityDaysAgo: 2 },
  { user: 'member-11', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 65 },
  { user: 'member-11', course: 'planning-a-community-project', lessons: 'all', activityDaysAgo: 20 },
  { user: 'member-12', course: 'welcome-to-glore', lessons: 'all', activityDaysAgo: 80 },
  { user: 'member-12', course: 'team-work', lessons: 1, activityDaysAgo: 5, selfLevel: 3 },
]

const COURSE_COMMENTS: Record<string, string> = {
  'volunteer:team-work': 'The lunch story made the theory very concrete.',
  'volunteer-progress:team-work': 'Short lessons and a quiz that really makes you think.',
}

export const planProgress = (certificates: PlannedCertificate[]) => {
  const byKey = new Map<string, DemoCourseProgress>()
  const languageOf = (user: string) => DEMO_USERS.find(({ key }) => key === user)?.locale ?? 'en'

  for (const certificate of certificates) {
    if (!certificate.holder || certificate.holder.length === 0) continue
    const base = certificate.seed.submitted + (certificate.status === 'draft' ? 3 : 4)
    for (const [index, entry] of certificate.skills.entries()) {
      const key = `${certificate.holder}:${entry.course}`
      if (byKey.has(key)) continue
      byKey.set(key, {
        user: certificate.holder,
        course: entry.course,
        lessons: 'all',
        activityDaysAgo: base + index * 4,
        partialQuiz: false,
        selfLevel: entry.selfLevel,
        rating: entry.selfLevel >= 4 ? 5 : 4,
        reflection: reflectionFor(languageOf(certificate.holder), index + certificate.skills.length),
      })
    }
  }

  for (const [index, entry] of EXPLICIT_PROGRESS.entries()) {
    const key = `${entry.user}:${entry.course}`
    const done = entry.lessons === 'all'
    byKey.set(key, {
      user: entry.user,
      course: entry.course,
      lessons: entry.lessons,
      activityDaysAgo: entry.activityDaysAgo,
      partialQuiz: entry.partialQuiz ?? false,
      selfLevel: entry.selfLevel ?? 4,
      rating: done ? ((entry.selfLevel ?? 4) >= 4 ? 5 : 4) : null,
      reflection: reflectionFor(languageOf(entry.user), index),
    })
  }

  return [...byKey.values()].toSorted((a, b) => a.user.localeCompare(b.user) || b.activityDaysAgo - a.activityDaysAgo)
}

export const courseRatingComment = (user: string, course: string) => COURSE_COMMENTS[`${user}:${course}`] ?? null

export const SKILL_COMPASS: Record<string, { strengths: string[]; goals: string[] }> = {
  volunteer: { strengths: ['team-work', 'responsibility'], goals: ['leadership', 'public-speaking'] },
  'volunteer-progress': { strengths: ['empathy'], goals: ['initiative', 'problem-solving'] },
}

export interface DemoInvitation {
  key: string
  organization: string
  invitee: string
  role: 'tutor' | 'volunteer' | 'representative'
  invitedBy: string
  sentDaysAgo: number
  acceptedDaysAgo: number | null
  locale: DemoLocale
  message: string | null
}

export const DEMO_INVITATIONS: DemoInvitation[] = [
  {
    key: 'rep',
    organization: 'ponte',
    invitee: 'rep',
    role: 'representative',
    invitedBy: 'owner',
    sentDaysAgo: 161,
    acceptedDaysAgo: 160,
    locale: 'it',
    message: null,
  },
  {
    key: 'tutor',
    organization: 'ponte',
    invitee: 'tutor',
    role: 'tutor',
    invitedBy: 'owner',
    sentDaysAgo: 151,
    acceptedDaysAgo: 150,
    locale: 'en',
    message: null,
  },
  {
    key: 'multi',
    organization: 'red',
    invitee: 'multi',
    role: 'tutor',
    invitedBy: 'owner-b',
    sentDaysAgo: 141,
    acceptedDaysAgo: 140,
    locale: 'es',
    message: null,
  },
  {
    key: 'invited-volunteer',
    organization: 'ponte',
    invitee: 'invited-volunteer',
    role: 'volunteer',
    invitedBy: 'owner',
    sentDaysAgo: 2,
    acceptedDaysAgo: null,
    locale: 'it',
    message: INVITATION_MESSAGES.volunteer,
  },
  {
    key: 'invited-tutor',
    organization: 'ponte',
    invitee: 'invited-tutor',
    role: 'tutor',
    invitedBy: 'owner',
    sentDaysAgo: 4,
    acceptedDaysAgo: null,
    locale: 'en',
    message: INVITATION_MESSAGES.tutor,
  },
  {
    key: 'red-invited',
    organization: 'red',
    invitee: 'red-invited',
    role: 'volunteer',
    invitedBy: 'owner-b',
    sentDaysAgo: 3,
    acceptedDaysAgo: null,
    locale: 'es',
    message: INVITATION_MESSAGES.red,
  },
]

export const INVITATION_EXPIRY_DAYS = 7

export const DEMO_INVITE_LINK = {
  key: 'volunteers',
  organization: 'ponte',
  role: 'volunteer',
  requiresApproval: true,
  maxUses: 20,
  uses: 1,
  createdBy: 'owner',
  createdDaysAgo: 12,
  expiresInDays: 25,
} as const

export interface DemoJoinRequest {
  key: string
  organization: string
  email: string
  firstName: string
  lastName: string
  role: 'volunteer'
  status: 'accepted' | 'pending' | 'rejected'
  user: string | null
  viaLink: boolean
  createdDaysAgo: number
  reviewedDaysAgo: number | null
  locale: DemoLocale
  message: string
  reviewerComment: string | null
}

export const DEMO_JOIN_REQUESTS: DemoJoinRequest[] = [
  {
    key: 'join-request',
    organization: 'ponte',
    email: 'join-request',
    firstName: 'Chiara',
    lastName: 'Bellini',
    role: 'volunteer',
    status: 'pending',
    user: null,
    viaLink: true,
    createdDaysAgo: 1,
    reviewedDaysAgo: null,
    locale: 'it',
    message: JOIN_REQUEST_MESSAGES.pending,
    reviewerComment: null,
  },
  {
    key: 'member-12-request',
    organization: 'ponte',
    email: 'member-12',
    firstName: 'Ivan',
    lastName: 'Kovac',
    role: 'volunteer',
    status: 'accepted',
    user: 'member-12',
    viaLink: false,
    createdDaysAgo: 86,
    reviewedDaysAgo: 85,
    locale: 'en',
    message: JOIN_REQUEST_MESSAGES.accepted,
    reviewerComment: null,
  },
  {
    key: 'rejected-request',
    organization: 'ponte',
    email: 'rejected-request',
    firstName: 'Tommaso',
    lastName: 'Neri',
    role: 'volunteer',
    status: 'rejected',
    user: null,
    viaLink: false,
    createdDaysAgo: 41,
    reviewedDaysAgo: 40,
    locale: 'it',
    message: JOIN_REQUEST_MESSAGES.rejected,
    reviewerComment: JOIN_REQUEST_MESSAGES.rejectedReply,
  },
]

export interface DemoEvent {
  type: string
  actor: string | null
  organization: string | null
  at: string
  data: Record<string, unknown>
}

const USER_FIELDS = ['holderId', 'tutorId', 'previousTutorId', 'userId', 'inviterId', 'newOwnerId', 'previousOwnerId']

const REF_FIELDS = {
  certificateId: 'certificate',
  courseId: 'course',
  inviteLinkId: 'inviteLink',
  invitationId: 'invitation',
  joinRequestId: 'joinRequest',
} as const

export interface EventContext {
  certificate: (key: string) => number
  course: (slug: string) => number
  invitation: (key: string) => number
  inviteLink: (key: string) => number
  joinRequest: (key: string) => number
  user: (key: string) => string
}

export const resolveEventData = (data: Record<string, unknown>, context: EventContext) =>
  Object.fromEntries(
    Object.entries(data).map(([field, value]) => {
      if (typeof value !== 'string') return [field, value]
      if (USER_FIELDS.includes(field)) return [field, context.user(value)]
      const ref = REF_FIELDS[field as keyof typeof REF_FIELDS]
      return [field, ref ? context[ref](value) : value]
    })
  )

const orgName = (key: string) => DEMO_ORGANIZATIONS.find(organization => organization.key === key)?.name ?? key

const fullName = (key: string) => {
  const user = DEMO_USERS.find(entry => entry.key === key)
  return user ? `${user.firstName} ${user.lastName}` : key
}

const event = (entry: DemoEvent) => entry

const certificateEvents = (certificate: PlannedCertificate, now: Date): DemoEvent[] => {
  const { organization, seed } = certificate
  const holder = certificate.holder
  const ref = (extra: Record<string, unknown>) =>
    holder
      ? { certificateId: certificate.key, holderId: holder, ...extra }
      : { certificateId: certificate.key, ...extra }
  const events: DemoEvent[] = []
  if (!certificate.submittedAt) return events

  const tutor = certificate.reviewer
  const first = seed.assignedAtSubmit ?? tutor
  events.push(
    event({
      type: 'certificate.submitted',
      actor: holder,
      organization,
      at: certificate.submittedAt,
      data: ref({ tutorId: first }),
    })
  )

  const claimed = ['in_review', 'changes_requested', 'approved', 'rejected', 'revoked'].includes(certificate.status)
  const claimedAt = ago(now, seed.submitted - 0.3)
  if (claimed && tutor) {
    events.push(
      event({ type: 'certificate.claimed', actor: tutor, organization, at: claimedAt, data: ref({ tutorId: tutor }) })
    )
  }

  if (seed.changesFirst && tutor) {
    events.push(
      event({
        type: 'certificate.changes_requested',
        actor: tutor,
        organization,
        at: ago(now, seed.submitted - 3),
        data: ref({ comment: certificate.reviews[0]?.comment ?? null, tutorId: tutor }),
      }),
      event({
        type: 'certificate.resubmitted',
        actor: holder,
        organization,
        at: ago(now, seed.submitted - 4),
        data: ref({ tutorId: tutor }),
      })
    )
  }

  if (certificate.status === 'changes_requested' && tutor && certificate.reviewedAt) {
    events.push(
      event({
        type: 'certificate.changes_requested',
        actor: tutor,
        organization,
        at: certificate.reviewedAt,
        data: ref({ comment: certificate.reviewerComment, tutorId: tutor }),
      })
    )
  }
  if ((certificate.status === 'approved' || certificate.status === 'revoked') && tutor && certificate.issuedAt) {
    events.push(
      event({
        type: 'certificate.approved',
        actor: tutor,
        organization,
        at: certificate.issuedAt,
        data: ref({ documentUrl: null, tutorId: tutor }),
      })
    )
  }
  if (certificate.status === 'rejected' && tutor && certificate.reviewedAt) {
    events.push(
      event({
        type: 'certificate.rejected',
        actor: tutor,
        organization,
        at: certificate.reviewedAt,
        data: ref({ reason: certificate.rejectedReason }),
      })
    )
  }
  if (certificate.status === 'withdrawn' && certificate.withdrawnAt) {
    events.push(
      event({
        type: 'certificate.withdrawn',
        actor: holder,
        organization,
        at: certificate.withdrawnAt,
        data: ref({ tutorId: tutor }),
      })
    )
  }
  if (certificate.status === 'revoked' && certificate.revokedAt) {
    events.push(
      event({
        type: 'certificate.revoked',
        actor: certificate.revokedBy,
        organization,
        at: certificate.revokedAt,
        data: ref({ reason: certificate.revokedReason }),
      })
    )
  }
  if (seed.unassigned !== undefined && first) {
    events.push(
      event({
        type: 'certificate.unassigned',
        actor: first,
        organization,
        at: ago(now, seed.unassigned),
        data: ref({ previousTutorId: first }),
      })
    )
  }
  if (seed.escalated && tutor) {
    events.push(
      event({
        type: 'certificate.review_reminder',
        actor: null,
        organization,
        at: ago(now, 6),
        data: ref({ days: 3, tutorId: tutor }),
      }),
      event({
        type: 'certificate.review_reminder',
        actor: null,
        organization,
        at: ago(now, 2),
        data: ref({ days: 7, tutorId: tutor }),
      }),
      event({
        type: 'certificate.review_escalated',
        actor: null,
        organization,
        at: ago(now, 1),
        data: ref({ days: 8, tutorId: tutor }),
      })
    )
  }

  return events
}

const joinedAt = (now: Date, user: string) => ago(now, DEMO_USERS.find(({ key }) => key === user)?.joinedDaysAgo ?? 30)

const organizationEvents = (now: Date, progress: DemoCourseProgress[]): DemoEvent[] => {
  const events: DemoEvent[] = []

  for (const organization of DEMO_ORGANIZATIONS) {
    const owner = DEMO_USERS.find(({ memberships }) => memberships[organization.key] === 'admin')
    const applicantName = owner ? `${owner.firstName} ${owner.lastName}` : 'Inês Carvalho'
    events.push(
      event({
        type: 'organization.application_received',
        actor: null,
        organization: organization.key,
        at: ago(now, organization.createdDaysAgo),
        data: {
          applicantName,
          city: organization.city,
          country: organization.country,
          locale: owner?.locale ?? 'en',
          organizationName: organization.name,
        },
      })
    )
    if (!organization.approved) continue
    events.push(
      event({
        type: 'organization.application_decided',
        actor: 'admin',
        organization: organization.key,
        at: ago(now, organization.createdDaysAgo - 2),
        data: {
          applicantName,
          approved: true,
          comment: null,
          locale: owner?.locale ?? 'en',
          organizationName: organization.name,
        },
      })
    )
  }

  events.push(
    event({
      type: 'team.invited',
      actor: 'admin',
      organization: null,
      at: ago(now, 292),
      data: {
        name: fullName('editor'),
        role: 'editor',
        userId: 'editor',
      },
    })
  )

  for (const invitation of DEMO_INVITATIONS) {
    const inviter = DEMO_USERS.find(({ key }) => key === invitation.invitedBy)
    const invitee = DEMO_USERS.find(({ key }) => key === invitation.invitee)
    events.push(
      event({
        type: 'invitation.sent',
        actor: invitation.invitedBy,
        organization: invitation.organization,
        at: ago(now, invitation.sentDaysAgo),
        data: {
          expiresAt: ago(now, invitation.sentDaysAgo - 7),
          invitationId: invitation.key,
          inviterId: invitation.invitedBy,
          inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : null,
          locale: invitation.locale,
          organizationName: orgName(invitation.organization),
          role: invitation.role,
          userId: null,
        },
      })
    )
    if (invitation.acceptedDaysAgo === null || !invitee) continue
    events.push(
      event({
        type: 'invitation.accepted',
        actor: invitation.invitee,
        organization: invitation.organization,
        at: ago(now, invitation.acceptedDaysAgo),
        data: {
          invitationId: invitation.key,
          inviterId: invitation.invitedBy,
          userId: invitation.invitee,
        },
      })
    )
  }

  const requested = new Set(DEMO_JOIN_REQUESTS.flatMap(({ user }) => (user ? [user] : [])))
  for (const user of DEMO_USERS) {
    for (const [organization, role] of Object.entries(user.memberships)) {
      if (role === 'admin') continue
      if (DEMO_INVITATIONS.some(entry => entry.invitee === user.key && entry.organization === organization)) continue
      events.push(
        event({
          type: 'member.joined',
          actor: user.key,
          organization,
          at: joinedAt(now, user.key),
          data: {
            role: user.key === 'tutor2' ? 'volunteer' : role,
            userId: user.key,
            via: requested.has(user.key) ? 'request' : 'link',
          },
        })
      )
    }
  }
  events.push(
    event({
      type: 'member.role_changed',
      actor: 'owner',
      organization: 'ponte',
      at: ago(now, 120),
      data: {
        previousRole: 'volunteer',
        role: 'tutor',
        userId: 'tutor2',
      },
    })
  )

  events.push(
    event({
      type: 'invite_link.created',
      actor: DEMO_INVITE_LINK.createdBy,
      organization: DEMO_INVITE_LINK.organization,
      at: ago(now, DEMO_INVITE_LINK.createdDaysAgo),
      data: {
        inviteLinkId: DEMO_INVITE_LINK.key,
        requiresApproval: DEMO_INVITE_LINK.requiresApproval,
        role: DEMO_INVITE_LINK.role,
      },
    })
  )

  for (const request of DEMO_JOIN_REQUESTS) {
    const name = `${request.firstName} ${request.lastName}`
    events.push(
      event({
        type: 'join_request.created',
        actor: request.user,
        organization: request.organization,
        at: ago(now, request.createdDaysAgo),
        data: {
          joinRequestId: request.key,
          name,
          organizationName: orgName(request.organization),
        },
      })
    )
    if (request.reviewedDaysAgo === null) continue
    events.push(
      event({
        type: 'join_request.decided',
        actor: 'owner',
        organization: request.organization,
        at: ago(now, request.reviewedDaysAgo),
        data: {
          accepted: request.status === 'accepted',
          comment: request.reviewerComment,
          joinRequestId: request.key,
          locale: request.locale,
          name,
          organizationName: orgName(request.organization),
          userId: request.user,
        },
      })
    )
  }

  events.push(
    event({
      type: 'account.suspended',
      actor: 'admin',
      organization: null,
      at: ago(now, 60),
      data: {
        expiresAt: ago(now, 53),
        reason: REVIEW_COMMENTS.suspended,
        userId: 'member-12',
      },
    }),
    event({
      type: 'account.reinstated',
      actor: 'admin',
      organization: null,
      at: ago(now, 53),
      data: { userId: 'member-12' },
    })
  )

  const named = progress.filter(
    entry => entry.lessons === 'all' && DEMO_USERS.some(user => user.key === entry.user && !user.background)
  )
  for (const entry of named) {
    const user = DEMO_USERS.find(({ key }) => key === entry.user)
    events.push(
      event({
        type: 'course.completed',
        actor: entry.user,
        organization: Object.keys(user?.memberships ?? {})[0] ?? null,
        at: ago(now, entry.activityDaysAgo),
        data: {
          courseId: entry.course,
          courseSlug: entry.course,
          userId: entry.user,
        },
      })
    )
  }
  for (const user of new Set(named.map(entry => entry.user))) {
    const skills = named
      .filter(entry => entry.user === user && SKILL_SLUGS.has(entry.course))
      .toSorted((a, b) => b.activityDaysAgo - a.activityDaysAgo)
    const third = skills[2]
    if (!third) continue
    const organization = Object.keys(DEMO_USERS.find(({ key }) => key === user)?.memberships ?? {})[0] ?? null
    events.push(
      event({
        type: 'learning.eligible',
        actor: user,
        organization,
        at: ago(now, third.activityDaysAgo - 0.1),
        data: { userId: user },
      })
    )
  }

  return events
}

const SKILL_SLUGS = new Set(Object.keys(SKILL_TEXTS))

export const planEvents = (now: Date, certificates: PlannedCertificate[], progress: DemoCourseProgress[]) =>
  [
    ...organizationEvents(now, progress),
    ...certificates.flatMap(certificate => certificateEvents(certificate, now)),
  ].toSorted((a, b) => a.at.localeCompare(b.at))

export const NOTIFICATION_WINDOW_DAYS = 60

export const UNREAD_WINDOW_DAYS = 3

export const rolesIn = (organization: string, roles: string[]) =>
  DEMO_USERS.filter(({ memberships }) => roles.includes(memberships[organization] ?? '')).map(({ key }) => key)

const PLATFORM_ADMINS = DEMO_USERS.filter(({ platformRole }) => platformRole === 'admin').map(({ key }) => key)

const pool = (organization: string | null, holder: string | null) =>
  organization ? rolesIn(organization, ['tutor']).filter(key => key !== holder) : []

const managers = (organization: string | null) =>
  organization ? rolesIn(organization, ['admin', 'representative']) : []

const str = (value: unknown) => (typeof value === 'string' ? value : null)

export const recipientsOf = ({ data, organization, type }: DemoEvent): string[] => {
  const holder = str(data.holderId)
  const tutor = str(data.tutorId)
  switch (type) {
    case 'certificate.submitted':
    case 'certificate.resubmitted':
      return tutor ? [tutor] : pool(organization, holder)
    case 'certificate.withdrawn':
    case 'certificate.review_reminder':
      return tutor ? [tutor] : []
    case 'certificate.claimed':
    case 'certificate.changes_requested':
    case 'certificate.rejected':
    case 'certificate.revoked':
      return holder ? [holder] : []
    case 'certificate.approved':
      return [...(holder ? [holder] : []), ...managers(organization)]
    case 'certificate.unassigned':
      return [...(str(data.previousTutorId) ? [str(data.previousTutorId) ?? ''] : []), ...pool(organization, holder)]
    case 'certificate.review_escalated':
    case 'join_request.created':
    case 'member.joined':
      return managers(organization)
    case 'learning.eligible':
    case 'course.completed':
    case 'member.role_changed':
      return [str(data.userId) ?? '']
    case 'invitation.accepted':
      return [str(data.inviterId) ?? '']
    case 'organization.application_received':
      return PLATFORM_ADMINS
    default:
      return []
  }
}

export interface PlannedNotification {
  user: string
  event: DemoEvent
  read: boolean
}

const NOTIFYING_EXCEPTIONS = new Set(['learning.eligible', 'course.completed'])

export const planNotifications = (now: Date, events: DemoEvent[]) =>
  events.flatMap(entry => {
    const age = (now.getTime() - Date.parse(entry.at)) / DAY_MS
    if (age > NOTIFICATION_WINDOW_DAYS) return []
    const recipients = [...new Set(recipientsOf(entry))].filter(
      user => user !== '' && (user !== entry.actor || NOTIFYING_EXCEPTIONS.has(entry.type))
    )
    return recipients.map((user): PlannedNotification => ({ user, event: entry, read: age >= UNREAD_WINDOW_DAYS }))
  })

export const notificationUrl = (type: string, data: Record<string, unknown>) => {
  const certificate = data.certificateId
  switch (type) {
    case 'certificate.submitted':
    case 'certificate.assigned':
    case 'certificate.resubmitted':
    case 'certificate.review_reminder':
      return `/certificates/${certificate}/review`
    case 'learning.eligible':
      return '/certificates/new'
    case 'course.completed':
      return `/courses/${data.courseSlug}`
    case 'organization.application_received':
      return '/admin/organizations'
    case 'invitation.accepted':
    case 'member.joined':
      return '/organization?tab=members'
    case 'join_request.created':
      return '/organization?tab=requests'
    case 'member.role_changed':
      return '/organization'
    default:
      return type.startsWith('certificate.') ? `/certificates/${certificate}` : null
  }
}

const PRIVATE_KEYS = new Set(['applicantEmail', 'documentUrl', 'email', 'firstName', 'invitationUrl', 'message', 'url'])

export const eventMetadata = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).filter(([field]) => !PRIVATE_KEYS.has(field)))

export const eventSubject = (type: string, data: Record<string, unknown>, organizationId: number | null) => {
  if ('certificateId' in data) return { type: 'certificate', id: String(data.certificateId) }
  if ('invitationId' in data) return { type: 'invitation', id: String(data.invitationId) }
  if ('inviteLinkId' in data) return { type: 'invite_link', id: String(data.inviteLinkId) }
  if ('joinRequestId' in data) return { type: 'join_request', id: String(data.joinRequestId) }
  if ('courseId' in data) return { type: 'course', id: String(data.courseId) }
  if (type === 'organization.application_received' || type === 'organization.application_decided') {
    return { type: 'organization', id: String(organizationId ?? '') }
  }
  if (type.startsWith('account.')) return { type: 'account', id: 'userId' in data ? String(data.userId) : '' }
  return { type: 'user', id: 'userId' in data ? String(data.userId) : '' }
}

export interface CertificateSnapshotInput {
  certificate: PlannedCertificate
  courses: Map<string, { icon: string | null; id: number; title: Record<string, string> | null }>
  holder: {
    birthPlace: string | null
    birthday: string | null
    firstName: string
    lastName: string | null
    nationality: string | null
  }
  organization: { id: number; legalRepresentative: string | null; name: string }
}

export const buildSnapshot = ({ certificate, courses, holder, organization }: CertificateSnapshotInput) => ({
  holder,
  organization: {
    id: organization.id,
    legalRepresentative: organization.legalRepresentative,
    logoUrl: null,
    name: organization.name,
    signatureUrl: null,
  },
  activity: {
    duration: certificate.activity.duration,
    endDate: certificate.activity.endDate,
    location: certificate.activity.location,
    startDate: certificate.activity.startDate,
    tasks: certificate.activity.tasks,
  },
  skills: certificate.skills.map(entry => {
    const course = courses.get(entry.course)
    if (!course) throw new Error(`Course ${entry.course} is not in the catalog`)
    return {
      courseId: course.id,
      icon: course.icon,
      level: entry.level ?? entry.selfLevel,
      name: course.title ?? { en: entry.course },
      statement: entry.statement,
    }
  }),
  issuedAt: certificate.issuedAt ?? '',
  language: certificate.language,
})

export const EDITOR_COURSES = [
  {
    slug: 'demo-active-listening-in-teams',
    title: { en: 'Active listening in teams', es: '', it: '' },
    languages: [] as string[],
    lessons: ['Why listening is a skill', 'Listening in a group meeting'],
    group: 'communication-skills',
    icon: 'ear',
    createdDaysAgo: 20,
  },
  {
    slug: 'demo-giving-and-receiving-feedback',
    title: {
      en: 'Giving and receiving feedback',
      es: 'Dar y recibir retroalimentación',
      it: '',
    },
    languages: [] as string[],
    lessons: ['Feedback that helps', 'Receiving feedback calmly', 'A feedback conversation step by step'],
    group: 'social-skills',
    icon: 'message-square',
    createdDaysAgo: 8,
  },
]

export const planDemo = (now: Date) => {
  const certificates = planCertificates(now)
  const progress = planProgress(certificates)
  const events = planEvents(now, certificates, progress)
  return { certificates, events, notifications: planNotifications(now, events), progress }
}
