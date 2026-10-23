import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { describeTargets, loadAllTargets } from '@/actions/translations/helpers'
import { coverageOf } from '@/db/queries/content-translation'
import { CacheTag } from '@/lib/cache'

const queryTranslationCoverage = async () => coverageOf(await describeTargets(await loadAllTargets()))

const fetchTranslationCoverage = async () => {
  'use cache'
  cacheTag(CacheTag.ContentTranslations, CacheTag.Courses, CacheTag.DocCategories, CacheTag.SkillGroups)
  cacheLife('minutes')

  return await queryTranslationCoverage()
}

export const loadTranslationCoverage = async ({ cache = true }: { cache?: boolean } = {}) =>
  cache ? await fetchTranslationCoverage() : await queryTranslationCoverage()
