'use client'

import { useState } from 'react'

import { FileTextIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ArticleCard } from '@/components/features/docs/article-card'
import { ArticleEditor } from '@/components/features/docs/article-editor'
import { ArticleSheet } from '@/components/features/docs/article-sheet'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'
import { type IntlRecord } from '@/lib/i18n'

interface DocsSectionProps {
  category: DocCategory
  allCategories: DocCategory[]
  canEdit: boolean
}

export const DocsSection = ({ allCategories, canEdit, category }: DocsSectionProps) => {
  const t = useTranslations('Docs')
  const { localize } = useI18n()

  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const title = localize(category.title as IntlRecord)

  const handleSelectArticle = (article: DocArticle) => {
    setSelectedArticle(article)
    setSheetOpen(true)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize">{title}</h2>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
            <PlusIcon className="size-4" />
            {t('editor.newArticle')}
          </Button>
        )}
      </div>

      {category.articles.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty')}</EmptyTitle>
          </EmptyHeader>
          {canEdit && (
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
                <PlusIcon className="size-4" />
                {t('editor.newArticle')}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.articles.map(article => (
            <ArticleCard key={article.id} article={article} onClick={() => handleSelectArticle(article)} />
          ))}
        </div>
      )}

      <ArticleSheet
        article={selectedArticle}
        canEdit={canEdit}
        categories={allCategories}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {canEdit && (
        <ArticleEditor
          categories={allCategories}
          defaultCategoryId={category.id}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
    </section>
  )
}
