'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { startCourse } from '@/actions/courses/progress'
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
import { toast } from '@/components/ui/toast'

interface StartCourseDialogProps {
  children: React.ReactNode
  courseId: number
  defaultOpen?: boolean
  language: string
  lessonCount: number
  lessonId: number | null
  title: string
}

export const StartCourseDialog = ({
  children,
  courseId,
  defaultOpen = false,
  language,
  lessonCount,
  lessonId,
  title,
}: StartCourseDialogProps) => {
  const t = useTranslations('Learning.overview')
  const tCommon = useTranslations('Common')
  const [open, setOpen] = useState(defaultOpen)
  const [starting, setStarting] = useState(false)

  const onStart = async () => {
    setStarting(true)
    const result = await startCourse(courseId, language, lessonId ?? undefined)
    if (!result) return
    toast.error(t('startError'))
    setStarting(false)
  }

  return (
    <AlertDialog onOpenChange={value => setOpen(starting ? true : value)} open={open}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('startDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('startDialog.description', { count: lessonCount, title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={starting} variant="outline">
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            loading={starting}
            onClick={event => {
              event.preventDefault()
              void onStart()
            }}
            variant="brand"
          >
            {t('start')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
