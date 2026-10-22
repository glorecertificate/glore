'use client'

import { useState } from 'react'

import { listDocCategories } from '@/actions/docs'
import { buildDocIndex, searchDocs } from '@/components/features/docs/search'
import { useI18n } from '@/components/providers/i18n'
import { type DocCategory } from '@/db/queries/doc'

export const useDocsSearch = (initial?: DocCategory[]) => {
  const { locale } = useI18n()
  const [loaded, setLoaded] = useState<DocCategory[] | null>(null)
  const categories = initial ?? loaded
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = async () => {
    if (categories || loading) return
    setLoading(true)
    setFailed(false)
    const { data, error } = await listDocCategories()
    setLoading(false)
    if (error || !data) {
      setFailed(true)
      return
    }
    setLoaded(data)
  }

  const index = categories ? buildDocIndex(categories, locale) : []
  const search = (query: string, limit?: number) => searchDocs(index, query, limit)

  return { failed, load, loading, ready: categories !== null, search }
}
