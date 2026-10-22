import { type Locale } from 'next-intl'

import { type EnumType } from '@/db/types'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'

type CourseType = EnumType<'course_type'>
type Role = EnumType<'role'>

export type CourseAccess = 'editor' | 'learner' | 'viewer'

export const courseAccess = (
  user: { canEdit: boolean; role: Role | null },
  course: { archivedAt: string | null; languages: string[] | null; type: CourseType | null }
): CourseAccess | null => {
  if (user.canEdit) return 'editor'
  if (course.archivedAt || !course.languages?.length) return null
  const type = course.type ?? 'intro'
  if (user.role === 'learner') return type === 'skill' ? null : 'learner'
  if (user.role === 'volunteer') return type === 'learner' ? null : 'learner'
  if (user.role === 'admin' || user.role === 'representative' || user.role === 'tutor') return 'viewer'
  return null
}

export const enrollableTypes = (role: Role | null): CourseType[] => {
  if (role === 'learner') return ['intro', 'learner']
  if (role === 'volunteer') return ['intro', 'skill']
  return []
}

export const pickLocale = <T extends string>(
  record: Partial<Record<Locale, T>> | null | undefined,
  language: Locale
): T | null => {
  if (!record) return null
  for (const locale of [language, DEFAULT_LOCALE, ...LOCALES]) {
    const value = record[locale]
    if (value?.trim()) return value
  }
  return null
}

export const pickLocaleList = (record: Partial<Record<Locale, string[]>> | null | undefined, language: Locale) => {
  if (!record) return []
  for (const locale of [language, DEFAULT_LOCALE, ...LOCALES]) {
    const value = record[locale]?.filter(item => item.trim())
    if (value?.length) return value
  }
  return []
}

export const resolveCourseLanguage = ({
  enrolled,
  languages,
  preferred,
  requested,
}: {
  enrolled?: Locale | null
  languages: Locale[]
  preferred: Locale
  requested?: Locale | null
}): Locale => {
  const available = new Set(languages)
  for (const candidate of [requested, enrolled, preferred, DEFAULT_LOCALE]) {
    if (candidate && available.has(candidate)) return candidate
  }
  return languages[0] ?? preferred
}

type LessonStatus = 'completed' | 'current' | 'upcoming'

interface OverviewLesson {
  hasAssessment: boolean
  hasEvaluations: boolean
  hasQuiz: boolean
  id: number
  status: LessonStatus
  title: string
}

export interface CourseOverview {
  description: string | null
  durationMinutes: number | null
  enrollment: { completedAt: string | null; locale: Locale } | null
  icon: string | null
  id: number
  language: Locale
  languages: Locale[]
  lessons: OverviewLesson[]
  outcomes: string[]
  progress: { completed: number; percent: number; total: number }
  rating: { average: number | null; count: number }
  resumeLessonId: number | null
  skillGroup: { id: number; name: string; slug: string } | null
  slug: string
  title: string
  type: CourseType
}

export interface OverviewRow {
  archivedAt: string | null
  description: Partial<Record<Locale, string>> | null
  durationMinutes: number | null
  icon: string | null
  id: number
  languages: string[] | null
  lessons: {
    assessments: { id: number }[]
    evaluations: { id: number }[]
    id: number
    questions: { id: number }[]
    sortOrder: number
    title: Partial<Record<Locale, string>>
    userLessons: { id: number }[]
  }[]
  outcomes: Partial<Record<Locale, string[]>> | null
  ratings: { rating: number }[]
  skillGroup: { id: number; name: Partial<Record<Locale, string>>; slug: string } | null
  slug: string
  title: Partial<Record<Locale, string>> | null
  type: CourseType | null
  userCourses: { completedAt: string | null; locale: string }[]
}

export const averageRating = (ratings: { rating: number }[]) =>
  ratings.length > 0
    ? Math.round((ratings.reduce((sum, { rating }) => sum + rating, 0) / ratings.length) * 10) / 10
    : null

export const buildOverview = (row: OverviewRow, language: Locale): CourseOverview => {
  const sorted = row.lessons.toSorted((a, b) => a.sortOrder - b.sortOrder)
  const enrollment = row.userCourses[0]
  const firstOpen = sorted.findIndex(lesson => lesson.userLessons.length === 0)
  const completed = sorted.filter(lesson => lesson.userLessons.length > 0).length
  const lessons = sorted.map((lesson, index) => ({
    hasAssessment: lesson.assessments.length > 0,
    hasEvaluations: lesson.evaluations.length > 0,
    hasQuiz: lesson.questions.length > 0,
    id: lesson.id,
    status: (lesson.userLessons.length > 0
      ? 'completed'
      : enrollment && index === firstOpen
        ? 'current'
        : 'upcoming') as LessonStatus,
    title: pickLocale(lesson.title, language) ?? '',
  }))

  return {
    description: pickLocale(row.description, language),
    durationMinutes: row.durationMinutes,
    enrollment: enrollment ? { completedAt: enrollment.completedAt, locale: enrollment.locale as Locale } : null,
    icon: row.icon,
    id: row.id,
    language,
    languages: (row.languages ?? []).filter((locale): locale is Locale => LOCALES.includes(locale as Locale)),
    lessons,
    outcomes: pickLocaleList(row.outcomes, language),
    progress: {
      completed,
      percent: sorted.length > 0 ? Math.round((completed / sorted.length) * 100) : 0,
      total: sorted.length,
    },
    rating: { average: averageRating(row.ratings), count: row.ratings.length },
    resumeLessonId: (firstOpen === -1 ? sorted[0] : sorted[firstOpen])?.id ?? null,
    skillGroup: row.skillGroup
      ? {
          id: row.skillGroup.id,
          name: pickLocale(row.skillGroup.name, language) ?? row.skillGroup.slug,
          slug: row.skillGroup.slug,
        }
      : null,
    slug: row.slug,
    title: pickLocale(row.title, language) ?? row.slug,
    type: row.type ?? 'intro',
  }
}

export interface SkillProgress {
  averageRating: number | null
  completedCourseIds: number[]
}

interface SkillEligibilityRules {
  minRating: number
  minSkills: number
}

export const evaluateEligibility = (
  { averageRating: average, completedCourseIds }: SkillProgress,
  rules: SkillEligibilityRules
) => {
  const completed = completedCourseIds.length
  const lowRating = average !== null && average < rules.minRating
  return {
    completed,
    eligible: completed >= rules.minSkills && !lowRating,
    lowRating,
    remaining: Math.max(0, rules.minSkills - completed),
  }
}

export const REFLECTION_MIN_LENGTH = 40
export const REFLECTION_MAX_LENGTH = 1000

type LocaleText = Partial<Record<Locale, string>>

export interface LearnerOption {
  id: number
  text: string
}

export interface LearnerQuestion {
  attempted: number[]
  correctOptionId: number | null
  explanation: string | null
  id: number
  options: LearnerOption[]
  solved: boolean
  text: string
}

export interface LearnerEvaluation {
  id: number
  text: string
  value: number | null
}

export interface LearnerAssessment {
  id: number
  reflection: string | null
  text: string | null
  value: number | null
}

export interface LearnerLesson {
  assessment: LearnerAssessment | null
  completed: boolean
  content: unknown[] | null
  contentLanguage: Locale | null
  evaluations: LearnerEvaluation[]
  id: number
  questions: LearnerQuestion[]
  title: string
}

export interface LessonDetailRow {
  assessments: { description: LocaleText | null; id: number }[]
  content: unknown
  evaluations: { description: LocaleText; id: number }[]
  id: number
  questions: {
    description: LocaleText
    explanation: LocaleText | null
    id: number
    options: { content: LocaleText; id: number }[]
  }[]
  title: LocaleText
}

export interface LessonStateRow {
  answers: { correct: boolean; optionId: number; questionId: number }[]
  assessment: { reflection: string | null; value: number } | null
  completed: boolean
  ratings: { evaluationId: number; value: number }[]
}

const MEDIA_BLOCKS = new Set(['audio', 'file', 'hr', 'img', 'media_embed', 'video'])

const hasContent = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const { children, text, type } = node as { children?: unknown[]; text?: unknown; type?: unknown }
  if (typeof text === 'string') return text.trim().length > 0
  if (typeof type === 'string' && MEDIA_BLOCKS.has(type)) return true
  return Array.isArray(children) && children.some(hasContent)
}

export const pickContent = (content: unknown, language: Locale) => {
  if (!content || typeof content !== 'object') return { language: null, value: null }
  const record = content as Partial<Record<Locale, unknown>>
  for (const locale of [language, DEFAULT_LOCALE, ...LOCALES]) {
    const value = record[locale]
    if (Array.isArray(value) && value.some(hasContent)) return { language: locale, value: value as unknown[] }
  }
  return { language: null, value: null }
}

export const buildLearnerLesson = (detail: LessonDetailRow, state: LessonStateRow, language: Locale): LearnerLesson => {
  const content = pickContent(detail.content, language)
  const ratings = new Map(state.ratings.map(({ evaluationId, value }) => [evaluationId, value]))
  const assessment = detail.assessments[0]

  return {
    assessment: assessment
      ? {
          id: assessment.id,
          reflection: state.assessment?.reflection ?? null,
          text: pickLocale(assessment.description, language),
          value: state.assessment?.value ?? null,
        }
      : null,
    completed: state.completed,
    content: content.value,
    contentLanguage: content.language,
    evaluations: detail.evaluations.map(evaluation => ({
      id: evaluation.id,
      text: pickLocale(evaluation.description, language) ?? '',
      value: ratings.get(evaluation.id) ?? null,
    })),
    id: detail.id,
    questions: detail.questions.map(question => {
      const given = state.answers.filter(answer => answer.questionId === question.id)
      const solved = given.find(answer => answer.correct)
      return {
        attempted: given.map(answer => answer.optionId).toSorted((a, b) => a - b),
        correctOptionId: solved?.optionId ?? null,
        explanation: given.length > 0 ? pickLocale(question.explanation, language) : null,
        id: question.id,
        options: question.options.map(option => ({ id: option.id, text: pickLocale(option.content, language) ?? '' })),
        solved: !!solved,
        text: pickLocale(question.description, language) ?? '',
      }
    }),
    title: pickLocale(detail.title, language) ?? '',
  }
}

export type CompletionIssue = 'assessment' | 'evaluations' | 'quiz' | 'reflection'

export interface CompletionInput {
  assessment?: { reflection: string; value: number }
  ratings?: { evaluationId: number; value: number }[]
}

const isRating = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5

export const checkCompletion = (lesson: LearnerLesson, input: CompletionInput) => {
  if (!lesson.questions.every(question => question.solved)) return { issue: 'quiz' as const }

  const given = new Map((input.ratings ?? []).map(({ evaluationId, value }) => [evaluationId, value]))
  const ratings = lesson.evaluations.map(evaluation => ({
    evaluationId: evaluation.id,
    value: evaluation.value ?? given.get(evaluation.id) ?? null,
  }))
  if (!ratings.every(({ value }) => isRating(value))) return { issue: 'evaluations' as const }

  if (!lesson.assessment) {
    return {
      assessment: null,
      ratings: ratings.map(({ evaluationId, value }) => ({ evaluationId, value: value ?? 0 })),
    }
  }

  const value = lesson.assessment.value ?? input.assessment?.value ?? null
  if (!isRating(value)) return { issue: 'assessment' as const }
  const reflection = (lesson.assessment.reflection ?? input.assessment?.reflection ?? '').trim()
  if (reflection.length < REFLECTION_MIN_LENGTH || reflection.length > REFLECTION_MAX_LENGTH) {
    return { issue: 'reflection' as const }
  }

  return {
    assessment: { assessmentId: lesson.assessment.id, reflection, value },
    ratings: ratings.map(({ evaluationId, value: rating }) => ({ evaluationId, value: rating ?? 0 })),
  }
}

export const resolveLessonTarget = ({
  access,
  lessons,
  requestedId,
}: {
  access: CourseAccess
  lessons: { id: number; status: LessonStatus }[]
  requestedId: number | null
}) => {
  if (lessons.length === 0) return null
  const open = lessons.findIndex(lesson => lesson.status !== 'completed')
  const requested = lessons.findIndex(lesson => lesson.id === requestedId)
  if (access !== 'learner') return lessons[requested === -1 ? 0 : requested]?.id ?? null
  const frontier = open === -1 ? lessons.length - 1 : open
  const index = requested === -1 ? (open === -1 ? 0 : open) : Math.min(requested, frontier)
  return lessons[index]?.id ?? null
}

export const COMMENT_MAX_LENGTH = 500

export type RatingIssue = 'COMMENT_TOO_LONG' | 'INVALID_RATING'

export const normalizeCourseRating = ({ comment, rating }: { comment?: string | null; rating: number }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { issue: 'INVALID_RATING' as const }
  const text = comment?.trim() ?? ''
  if (text.length > COMMENT_MAX_LENGTH) return { issue: 'COMMENT_TOO_LONG' as const }
  return { comment: text || null, rating }
}

export interface RecommendationCandidate {
  icon: string | null
  id: number
  skillGroupId: number | null
  slug: string
  sortOrder: number | null
  title: Partial<Record<Locale, string>> | null
  type: CourseType | null
}

export interface CourseRecommendation {
  icon: string | null
  slug: string
  title: string
  type: CourseType
}

export const pickRecommendation = (
  candidates: RecommendationCandidate[],
  skillGroupId: number | null,
  language: Locale
): CourseRecommendation | null => {
  const rank = (candidate: RecommendationCandidate) => (skillGroupId && candidate.skillGroupId === skillGroupId ? 0 : 1)
  const [best] = candidates.toSorted(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.id - b.id
  )
  if (!best) return null
  return {
    icon: best.icon,
    slug: best.slug,
    title: pickLocale(best.title, language) ?? best.slug,
    type: best.type ?? 'intro',
  }
}

export interface CompletionSkill {
  level: 1 | 2 | 3 | 4 | 5
  title: string
}

export const buildCompletionSkills = (
  rows: { title: LocaleText; value: number }[],
  language: Locale
): CompletionSkill[] =>
  rows.map(({ title, value }) => ({
    level: Math.min(5, Math.max(1, Math.round(value))) as CompletionSkill['level'],
    title: pickLocale(title, language) ?? '',
  }))

export const COMPASS_MAX_STRENGTHS = 3
export const COMPASS_MAX_GOALS = 5

export type CompassIssue = 'DUPLICATE' | 'OVERLAP' | 'TOO_MANY_GOALS' | 'TOO_MANY_STRENGTHS' | 'UNKNOWN_COURSE'

export const validateCompass = (
  { goals, strengths }: { goals: number[]; strengths: number[] },
  available: Set<number>
) => {
  if (strengths.length > COMPASS_MAX_STRENGTHS) return { issue: 'TOO_MANY_STRENGTHS' as const }
  if (goals.length > COMPASS_MAX_GOALS) return { issue: 'TOO_MANY_GOALS' as const }
  const all = [...strengths, ...goals]
  if (new Set(strengths).size !== strengths.length || new Set(goals).size !== goals.length) {
    return { issue: 'DUPLICATE' as const }
  }
  if (new Set(all).size !== all.length) return { issue: 'OVERLAP' as const }
  if (all.some(id => !available.has(id))) return { issue: 'UNKNOWN_COURSE' as const }
  return { goals, strengths }
}

export interface SkillOption {
  completed: boolean
  icon: string | null
  id: number
  skillGroupId: number | null
  slug: string
  sortOrder: number | null
  title: string
}

export const recommendFromCompass = (options: SkillOption[], goals: number[], limit: number) => {
  const open = options.filter(option => !option.completed)
  const byId = new Map(open.map(option => [option.id, option]))
  const picked = goals.reduce<SkillOption[]>((list, id) => {
    const option = byId.get(id)
    if (option) list.push(option)
    return list
  }, [])
  const chosen = new Set(picked.map(({ id }) => id))
  const rest = open
    .filter(({ id }) => !chosen.has(id))
    .toSorted(
      (a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.id - b.id
    )
  return [...picked, ...rest].slice(0, limit)
}
