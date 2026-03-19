'use client'

import { useState } from 'react'

import { CalendarIcon, PencilIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ArticleEditor } from '@/components/features/docs/article-editor'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'
import { useI18n } from '@/hooks/use-i18n'

interface ArticleSheetProps {
  article: DocArticle | null
  categories: DocCategory[]
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ArticleSheet = ({ article, canEdit, categories, onOpenChange, open }: ArticleSheetProps) => {
  const t = useTranslations('Docs')
  const { locale, localize } = useI18n()
  const [editorOpen, setEditorOpen] = useState(false)

  if (!article) return null

  const title = localize(article.title)
  const content = localize(article.content)
  const updatedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(article.updatedAt))

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="mb-2">
            <div className="flex items-start justify-between gap-3 pr-2">
              <SheetTitle className="text-xl leading-snug">{title}</SheetTitle>
              {canEdit && (
                <Button className="mt-0.5 shrink-0" size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
                  <PencilIcon className="size-3.5" />
                  {t('editor.editArticle')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="size-3 shrink-0" />
              <span>{t('lastUpdated', { date: updatedAt })}</span>
            </div>
          </SheetHeader>
          <Separator className="mb-6" />
          <Markdown className="prose-sm text-foreground">{content}</Markdown>
        </SheetContent>
      </Sheet>

      {canEdit && (
        <ArticleEditor article={article} categories={categories} open={editorOpen} onOpenChange={setEditorOpen} />
      )}
    </>
  )
}
