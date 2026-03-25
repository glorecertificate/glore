'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { CalendarIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { deleteDocArticle } from '@/actions/doc'
import { ArticleEditor } from '@/components/features/docs/article-editor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  const router = useRouter()
  const { locale, localize } = useI18n()
  const [editorOpen, setEditorOpen] = useState(false)

  if (!article) return null

  const title = localize(article.title)
  const content = localize(article.content)
  const updatedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(article.updatedAt))

  const handleDelete = async () => {
    const { error } = await deleteDocArticle(article.id)
    if (error) {
      toast.error(t('editor.deleteError'))
      return
    }
    toast.success(t('editor.deleted'))
    onOpenChange(false)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="mb-2">
            <div className="flex items-start justify-between gap-3 pr-2">
              <SheetTitle className="text-xl leading-snug">{title}</SheetTitle>
              {canEdit && (
                <div className="flex shrink-0 gap-1.5">
                  <Button className="mt-0.5" size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
                    <PencilIcon className="size-3.5" />
                    {t('editor.editArticle')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="mt-0.5 text-destructive hover:text-destructive" size="sm" variant="outline">
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('editor.deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('editor.deleteConfirmMessage')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('editor.delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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
