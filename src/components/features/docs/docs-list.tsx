'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { DocsSection } from '@/components/features/docs/docs-section'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { useDocsSearch } from '@/components/features/docs/use-docs-search'
import { LucideIcon } from '@/components/icons/lucide'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FilterBar } from '@/components/ui/filter-bar'
import { SearchInput } from '@/components/ui/search'
import { type DocCategory } from '@/db/queries/doc'
import { SHORTCUTS } from '@/lib/shortcuts'

interface DocsListProps {
  categories: DocCategory[]
  canEdit: boolean
}

export const DocsList = ({ canEdit, categories }: DocsListProps) => {
  const [query, setQuery] = useState('')

  const tCommon = useTranslations('Common')
  const tSearch = useTranslations('Search')
  const t = useTranslations('Docs')

  const docs = useDocsSearch(categories)
  const matches = query.trim() ? new Set(docs.search(query, 500).map(({ articleId }) => articleId)) : null

  const filteredCategories = matches
    ? categories.reduce<DocCategory[]>((result, category) => {
        const articles = category.articles.filter(article => matches.has(article.id))
        if (articles.length > 0) result.push({ ...category, articles })
        return result
      }, [])
    : categories

  const term = query.trim()
  const total = filteredCategories.reduce((sum, category) => sum + category.articles.length, 0)

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar active={term.length > 0} onClear={() => setQuery('')}>
          <SearchInput
            aria-label={tCommon('searchItems')}
            className="sm:w-80"
            hotkey={SHORTCUTS.filter.key}
            placeholder={tCommon('searchItems')}
            value={query}
            onValueChange={setQuery}
          />
          {term && <output className="type-caption text-fg-2">{t('search.results', { count: total })}</output>}
        </FilterBar>
        {canEdit && <CategoryManagerTrigger categories={categories} />}
      </div>

      {filteredCategories.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="search-x" />
            </EmptyMedia>
            <EmptyTitle>{tSearch('noResults')}</EmptyTitle>
            <EmptyDescription>{t('search.noMatches', { query: term })}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        filteredCategories.map(category => (
          <DocsSection key={category.id} allCategories={categories} canEdit={canEdit} category={category} />
        ))
      )}
    </>
  )
}
