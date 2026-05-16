'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'

import { FilePlusCornerIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { CourseSettings } from '@/components/features/courses/course-editor/settings'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { type Course } from '@/db/queries/course'

export const CourseDialog = ({
  children,
  course,
  onOpenChange,
  onSuccess,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  course?: Course
  onSuccess?: (course: Course) => void
}) => {
  const { push } = useRouter()
  const t = useTranslations('Courses')

  const [isPending, startTransition] = useTransition()
  const toastIdRef = useRef<string | number | undefined>(undefined)

  useEffect(
    () => () => {
      if (toastIdRef.current !== undefined) {
        toast.dismiss(toastIdRef.current)
      }
    },
    []
  )

  const isEdit = !!course
  const Icon = isEdit ? SettingsIcon : FilePlusCornerIcon
  const title = isEdit ? t('settings') : t('newCourse')
  const description = isEdit ? t('courseSettingsDescription') : t('newCourseDescription')

  const handleSuccess = (updated: Course) => {
    if (isEdit) {
      toast.success(t('courseSettingsUpdated'))
      onOpenChange?.(false)
      onSuccess?.(updated)
      return
    }
    toastIdRef.current = toast.success(
      <div className="flex flex-col gap-1">
        <p className="font-medium">{t('courseCreated')}</p>
        <p className="flex items-center gap-1 leading-[normal] text-muted-foreground">
          {t('redirectingToCourse')}
          <Spinner className="mt-0.5 size-3" />
        </p>
      </div>,
      { duration: Infinity }
    )
    startTransition(() => {
      push(`/courses/${updated.slug}`)
    })
    onSuccess?.(updated)
  }

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      {children}
      <DialogContent onCloseAutoFocus={e => e.preventDefault()} className="gap-6 p-8" size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CourseSettings
          course={course}
          disabled={isEdit ? undefined : isPending}
          onError={() => {
            toast.error(isEdit ? t('courseUpdateFailed') : t('courseCreationFailed'))
          }}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
