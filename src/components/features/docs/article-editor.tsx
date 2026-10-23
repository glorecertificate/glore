'use client'

import { ArticleEditorForm } from '@/components/features/docs/article-editor-form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'

interface ArticleEditorProps {
  article?: DocArticle
  categories: DocCategory[]
  defaultCategoryId?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ArticleEditor = ({ onOpenChange, open, ...props }: ArticleEditorProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <ArticleEditorForm onOpenChange={onOpenChange} {...props} />
    </DialogContent>
  </Dialog>
)
