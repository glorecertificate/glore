'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteDocArticle } from '@/actions/docs'
import { ArticleEditor } from '@/components/features/docs/article-editor'
import { LucideIcon } from '@/components/icons/lucide'
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
import { toast } from '@/components/ui/toast'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'

export const ArticleActions = ({ article, categories }: { article: DocArticle; categories: DocCategory[] }) => {
  const t = useTranslations('Docs')
  const { push, refresh } = useRouter()
  const [editorOpen, setEditorOpen] = useState(false)

  const onDelete = async () => {
    const { error } = await deleteDocArticle(article.id)
    if (error) {
      toast.error(t('editor.deleteError'))
      return
    }
    toast.success(t('editor.deleted'))
    startTransition(() => push('/docs'))
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" variant="band-secondary" onClick={() => setEditorOpen(true)}>
        <LucideIcon name="pencil" className="size-3.5" />
        {t('editor.editArticle')}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button aria-label={t('editor.delete')} size="sm" variant="band-secondary">
            <LucideIcon name="trash-2" className="size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('editor.deleteConfirmMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{t('editor.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ArticleEditor
        article={article}
        categories={categories}
        open={editorOpen}
        onOpenChange={open => {
          setEditorOpen(open)
          if (!open) refresh()
        }}
      />
    </div>
  )
}
