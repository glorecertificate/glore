'use client'

import { useState } from 'react'

import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const CourseListDialog = (props: React.ComponentProps<typeof CourseDialog>) => {
  const t = useTranslations('Courses')
  const [open, setOpen] = useState(false)

  return (
    <CourseDialog {...props} onOpenChange={setOpen} open={open}>
      <Tooltip delayDuration={0} disableHoverableContent>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button aria-label={t('createCourse')} className="size-8 rounded-full" size="icon" variant="brand">
              <PlusIcon className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{t('createCourse')}</TooltipContent>
      </Tooltip>
    </CourseDialog>
  )
}
