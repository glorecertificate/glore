'use client'

import { BookDashedIcon, PlusIcon } from 'lucide-react'

import { useCourseList } from '@/components/features/courses/course-list/course-list-context'
import { CourseSettings } from '@/components/features/courses/course-settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const CourseListDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const { t, addCourse } = useCourseList()

  return (
    <Dialog {...props}>
      <Tooltip delayDuration={0} disableHoverableContent>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              className="size-8 rounded-full text-[13px] hover:scale-105 focus:scale-105"
              size="icon"
              variant="brand"
            >
              <PlusIcon className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{t('createCourse')}</TooltipContent>
      </Tooltip>
      <DialogContent className="gap-6 p-8" size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookDashedIcon className="size-5" />
            {t('newCourse')}
          </DialogTitle>
          <DialogDescription>{t('newCourseDescription')}</DialogDescription>
        </DialogHeader>
        <CourseSettings onSubmit={addCourse} />
      </DialogContent>
    </Dialog>
  )
}
