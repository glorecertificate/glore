'use client'

import { useMemo, useState } from 'react'

import { SearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DocsSection } from '@/components/features/docs/docs-section'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { Input } from '@/components/ui/input'
import { type DocCategory } from '@/db/queries/doc'
import { useI18n } from '@/hooks/use-i18n'
import { type IntlRecord } from '@/lib/i18n'

interface DocsListProps {
  categories: DocCategory[]
  canEdit: boolean
}

export const DocsList = ({ canEdit, categories }: DocsListProps) => {
  const [query, setQuery] = useState('')

  const tCommon = useTranslations('Common')
  const tSearch = useTranslations('Search')
  const { localize } = useI18n()

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return categories

    return categories.reduce<DocCategory[]>((result, category) => {
      const categoryTitle = localize(category.title as IntlRecord).toLowerCase()
      if (categoryTitle.includes(normalizedQuery)) {
        result.push(category)
        return result
      }

      const articles = category.articles.filter(article => {
        const articleTitle = localize(article.title).toLowerCase()
        const articleExcerpt = article.excerpt ? localize(article.excerpt).toLowerCase() : ''
        return articleTitle.includes(normalizedQuery) || articleExcerpt.includes(normalizedQuery)
      })

      if (articles.length === 0) return result
      result.push({ ...category, articles })
      return result
    }, [])
  }, [categories, localize, query])

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="sm:max-w-sm"
          icon={SearchIcon}
          placeholder={tCommon('searchItems')}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {canEdit && <CategoryManagerTrigger categories={categories} />}
      </div>

      {filteredCategories.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{tSearch('noResults')}</p>
      ) : (
        filteredCategories.map(category => (
          <DocsSection key={category.id} allCategories={categories} canEdit={canEdit} category={category} />
        ))
      )}
    </>
  )
}
