import 'server-only'

import { cache } from 'react'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import {
  findCompletionDetails,
  findCourseOverview,
  findRecommendationCandidates,
  getSkillProgress,
  loadLearnerLesson,
} from '@/actions/courses/data'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import {
  buildCompletionSkills,
  buildOverview,
  courseAccess,
  enrollableTypes,
  evaluateEligibility,
  pickRecommendation,
  resolveCourseLanguage,
  resolveLessonTarget,
} from '@/db/queries/learning'
import appConfig from '~/config/app.json'

export const getLearningContext = async () => {
  const [user, orgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  const role = user.organizations.find(({ id }) => id === orgId)?.role ?? null
  return { orgId, role, user }
}

export const loadCourseOverview = cache(async (slug: string, requested: Locale | null, preferred: Locale) => {
  const { role, user } = await getLearningContext()
  const row = await findCourseOverview(slug, user.id)
  if (!row) return null
  const access = courseAccess({ canEdit: user.canEdit, role }, row)
  if (!access) return null
  const language = resolveCourseLanguage({
    enrolled: (row.userCourses[0]?.locale as Locale | undefined) ?? null,
    languages: (row.languages ?? []) as Locale[],
    preferred,
    requested,
  })
  return { access, overview: buildOverview(row, language), role, user }
})

export const loadPlayer = cache(async (slug: string, requestedLesson: number | null, requested: Locale | null) => {
  const data = await loadCourseOverview(slug, requested, (await getLocale()) as Locale)
  if (!data) return { status: 'not-found' as const }

  const { access, overview, user } = data
  if (access === 'learner' && !overview.enrollment) return { status: 'overview' as const }

  const target = resolveLessonTarget({ access, lessons: overview.lessons, requestedId: requestedLesson })
  if (target === null) return { status: 'overview' as const }
  if (target !== requestedLesson) {
    return { language: overview.language, lessonId: target, status: 'redirect' as const }
  }

  const lesson = await loadLearnerLesson(target, user.id, overview.language)
  if (!lesson) return { status: 'not-found' as const }
  return { access, lesson, overview, status: 'ok' as const }
})

export const loadCompletion = cache(async (slug: string, requested: Locale | null) => {
  const data = await loadCourseOverview(slug, requested, (await getLocale()) as Locale)
  if (!data) return { status: 'not-found' as const }

  const { access, overview, role, user } = data
  const completed = !!overview.enrollment?.completedAt
  if (access !== 'learner' || !completed) return { status: 'overview' as const }

  const [details, candidates, skillProgress] = await Promise.all([
    findCompletionDetails(overview.id, user.id),
    findRecommendationCandidates(user.id, enrollableTypes(role), overview.id),
    role === 'volunteer' ? getSkillProgress(user.id) : null,
  ])

  return {
    completion: {
      eligibility: skillProgress ? evaluateEligibility(skillProgress, appConfig) : null,
      myRating: details.rating,
      recommendation: pickRecommendation(candidates, overview.skillGroup?.id ?? null, overview.language),
      skills: buildCompletionSkills(details.assessmentRows, overview.language),
    },
    overview,
    status: 'ok' as const,
  }
})
