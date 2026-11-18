'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'

export const CourseListDialog = (props: React.ComponentProps<typeof CourseDialog>) => {
  const t = useTranslations('CourseCommon')
  const [open, setOpen] = useState(false)

  return (
    <CourseDialog {...props} onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button icon="plus" variant="band">
          {t('createCourse')}
        </Button>
      </DialogTrigger>
    </CourseDialog>
  )
}
