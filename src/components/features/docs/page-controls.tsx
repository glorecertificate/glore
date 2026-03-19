'use client'

import { useState } from 'react'

import { Settings2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CategoryManager } from '@/components/features/docs/category-manager'
import { Button } from '@/components/ui/button'
import { type DocCategory } from '@/db/queries/doc'

interface CategoryManagerTriggerProps {
  categories: DocCategory[]
}

export const CategoryManagerTrigger = ({ categories }: CategoryManagerTriggerProps) => {
  const t = useTranslations('Docs')
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Settings2Icon className="size-4" />
          {t('categories.manage')}
        </Button>
      </div>
      <CategoryManager categories={categories} open={open} onOpenChange={setOpen} />
    </>
  )
}
