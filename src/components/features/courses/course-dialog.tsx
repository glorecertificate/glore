'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { LucideIcon } from '@/components/icons/lucide'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { type Course } from '@/db/queries/course'

const CourseSettings = dynamic(
  async () => (await import('@/components/features/courses/course-editor/settings')).CourseSettings,
  { loading: () => <Skeleton className="h-96 w-full rounded-lg" /> }
)

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
  const t = useTranslations('CourseCommon')

  const isEdit = !!course
  const icon = isEdit ? 'settings' : 'file-plus-corner'
  const title = isEdit ? t('settings') : t('newCourse')
  const description = isEdit ? t('courseSettingsDescription') : t('newCourseDescription')

  const handleSuccess = (updated: Course) => {
    onOpenChange?.(false)
    if (isEdit) {
      toast.success(t('courseSettingsUpdated'))
      onSuccess?.(updated)
      return
    }
    push(`/courses/${updated.slug}`, { transitionTypes: ['course-created'] })
    onSuccess?.(updated)
  }

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      {children}
      <DialogContent
        onCloseAutoFocus={e => e.preventDefault()}
        className="max-h-[90svh] gap-6 overflow-y-auto p-8"
        size="lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LucideIcon name={icon} className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CourseSettings
          course={course}
          onError={() => {
            toast.error(isEdit ? t('courseUpdateFailed') : t('courseCreationFailed'))
          }}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
