import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { loadAllTargets } from '@/actions/translations/helpers'
import { gapsOf } from '@/db/queries/content-translation'
import { CacheTag } from '@/lib/cache'

const queryTranslationGaps = async () => gapsOf(await loadAllTargets())

const fetchTranslationGaps = async () => {
  'use cache'
  cacheTag(CacheTag.ContentTranslations, CacheTag.Courses, CacheTag.DocCategories, CacheTag.SkillGroups)
  cacheLife('minutes')

  return await queryTranslationGaps()
}

export const loadTranslationGaps = async ({ cache = true }: { cache?: boolean } = {}) =>
  cache ? await fetchTranslationGaps() : await queryTranslationGaps()
