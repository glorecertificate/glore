'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { TranslateDialog } from '@/components/features/courses/course-editor/translate-dialog'
import { Button } from '@/components/ui/button'

export const CourseTranslation = () => {
  const t = useTranslations('CourseTranslate')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button icon="languages" onClick={() => setOpen(true)} variant="outline">
        {t('open')}
      </Button>
      <TranslateDialog onOpenChange={setOpen} open={open} />
    </>
  )
}
