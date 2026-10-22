'use client'

import { useState } from 'react'

import { SearchIcon, SearchXIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DocsSection } from '@/components/features/docs/docs-section'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { useDocsSearch } from '@/components/features/docs/use-docs-search'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { type DocCategory } from '@/db/queries/doc'

interface DocsListProps {
  categories: DocCategory[]
  canEdit: boolean
}

export const DocsList = ({ canEdit, categories }: DocsListProps) => {
  const [query, setQuery] = useState('')

  const tCommon = useTranslations('Common')
  const tSearch = useTranslations('Search')

  const docs = useDocsSearch(categories)
  const matches = query.trim() ? new Set(docs.search(query, 500).map(({ articleId }) => articleId)) : null

  const filteredCategories = matches
    ? categories.reduce<DocCategory[]>((result, category) => {
        const articles = category.articles.filter(article => matches.has(article.id))
        if (articles.length > 0) result.push({ ...category, articles })
        return result
      }, [])
    : categories

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
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{tSearch('noResults')}</EmptyTitle>
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
