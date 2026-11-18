import { cacheLife, cacheTag } from 'next/cache'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { findSkillCompass, findSkillOptions } from '@/actions/courses/data'
import { getViewerContext } from '@/actions/viewer'
import { SkillCompassCard } from '@/components/features/courses/skill-compass/card'
import { recommendFromCompass } from '@/db/queries/learning'
import { CacheTag, LIVE_LIFE, progressUserTag } from '@/lib/cache'

const COMPASS_RECOMMENDATIONS = 3

const fetchCompass = async (userId: string, language: Locale) => {
  'use cache'
  cacheTag(CacheTag.Courses, progressUserTag(userId))
  cacheLife(LIVE_LIFE)

  const [compass, options] = await Promise.all([findSkillCompass(userId), findSkillOptions(userId, language)])
  return { compass, options }
}

export const SkillCompassSection = async () => {
  const { role, user } = await getViewerContext()
  if (user.canEdit || role !== 'volunteer') return null

  const language = (await getLocale()) as Locale
  const { compass, options } = await fetchCompass(user.id, language)
  if (options.length === 0) return null

  const hasCompass = compass.goals.length + compass.strengths.length > 0
  const recommendations = hasCompass ? recommendFromCompass(options, compass.goals, COMPASS_RECOMMENDATIONS) : []

  return (
    <SkillCompassCard
      goals={compass.goals}
      options={options.map(({ completed, icon, id, slug, title }) => ({ completed, icon, id, slug, title }))}
      recommendations={recommendations.map(({ icon, id, slug, title }) => ({ icon, id, slug, title }))}
      strengths={compass.strengths}
    />
  )
}
