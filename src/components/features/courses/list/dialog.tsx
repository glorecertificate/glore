'use client'

import { memo, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { FilePlusCornerIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { CourseSettings } from '@/components/features/courses/editor/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const CourseListDialog = memo(({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const router = useRouter()
  const t = useTranslations('Courses')

  const [isPending, startTransition] = useTransition()
  const toastIdRef = useRef<string | number | undefined>(undefined)

  useEffect(
    () => () => {
      if (toastIdRef.current !== undefined) toast.dismiss(toastIdRef.current)
    },
    []
  )

  return (
    <Dialog {...props}>
      <Tooltip delayDuration={0} disableHoverableContent>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              className="size-8 rounded-full text-[13px] hover:scale-102 focus:scale-102"
              size="icon"
              variant="brand"
            >
              <PlusIcon className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>{t('createCourse')}</TooltipContent>
      </Tooltip>
      <DialogContent className="gap-6 p-8" size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlusCornerIcon className="size-5" />
            {t('newCourse')}
          </DialogTitle>
          <DialogDescription>{t('newCourseDescription')}</DialogDescription>
        </DialogHeader>
        <CourseSettings
          disabled={isPending}
          onError={() => {
            toast.error(t('courseCreationFailed'))
          }}
          onSuccess={({ slug }) => {
            toastIdRef.current = toast.success(
              <div className="flex flex-col gap-1">
                <p className="font-medium">{t('courseCreated')}</p>
                <p className="flex items-center gap-1 text-muted-foreground leading-[normal]">
                  {t('redirectingToCourse')}
                  <Spinner className="mt-0.5 size-3" />
                </p>
              </div>,
              { duration: Infinity }
            )
            startTransition(() => {
              router.push(`/courses/${slug}`)
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
})
