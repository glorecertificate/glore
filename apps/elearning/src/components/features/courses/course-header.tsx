'use client'

import { useMemo } from 'react'

import { EyeIcon, HistoryIcon, Settings2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CourseSettings } from '@/components/features/courses/course-settings'
import { CourseSettingsModal } from '@/components/features/courses/course-settings-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MotionTabsList, MotionTabsTrigger } from '@/components/ui/motion-tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { useScroll } from '@/hooks/use-scroll'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const CourseHeader = () => {
  const { course, step } = useCourse()
  const { localeItems } = useIntl()
  const { scrolled } = useScroll()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const hasLessons = useMemo(() => course.lessons && course.lessons.length > 0, [course.lessons])
  const progressColor = useMemo(() => (course.completion === 100 ? 'success' : 'default'), [course.completion])

  return (
    <div
      className={cn(
        'sticky top-36 z-50 hidden w-full items-center justify-between gap-2 bg-background px-1 pb-4 md:top-[72px] md:flex',
        scrolled && 'border-b'
      )}
    >
      {user.canEdit ? (
        <>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="xs" variant="outline">
                        <Settings2Icon className="size-3.5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent arrow={false} className="max-w-72 text-center">
                    {t('settings')}
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="gap-6" portal={false}>
                  <DialogHeader>
                    <DialogTitle>
                      <Settings2Icon className="mr-2 inline-block size-4" />
                      {t('settingsTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                      {t('settingsDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <CourseSettings course={course} />
                </DialogContent>
              </Dialog>
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="xs" variant="outline">
                        <HistoryIcon className="size-3.5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent arrow={false} className="max-w-72 text-center">
                    {t('history')}
                  </TooltipContent>
                </Tooltip>
                <DialogContent size="lg">
                  <DialogTitle>
                    <Settings2Icon />
                    {t('settings')}
                  </DialogTitle>
                  <DialogDescription className="mb-4 text-muted-foreground text-sm">
                    {t('description')}
                  </DialogDescription>
                </DialogContent>
              </Dialog>
            </div>
            <MotionTabsList className="w-full sm:w-fit" size="xs">
              {localeItems.map(({ displayLabel, icon, value }) => (
                <MotionTabsTrigger className="flex items-center gap-1 text-[13px]" key={value} value={value}>
                  {displayLabel}{' '}
                  <span className="opacity-70 grayscale-75 group-data-[state=active]/motion-tabs-trigger:opacity-100 group-data-[state=active]/motion-tabs-trigger:grayscale-0">
                    {icon}
                  </span>
                </MotionTabsTrigger>
              ))}
            </MotionTabsList>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              {t('saveDraft')}
            </Button>
            <Button size="sm" variant="success">
              {t('publish')}
            </Button>
          </div>
          <CourseSettingsModal course={course} onOpenChange={() => {}} open={false} />
        </>
      ) : (
        <>
          <div className="flex h-full items-center gap-2">
            <span className="pt-1 text-muted-foreground text-sm">
              {hasLessons
                ? t('lessonCount', {
                    count: String(step + 1),
                    total: String(course.lessons?.length || 0),
                  })
                : ''}
            </span>
          </div>
          {user.isLearner && (
            <>
              {course.progress === 'completed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className="mr-2 cursor-help rounded-full border-muted-foreground/60 p-1.5 text-muted-foreground/90"
                      variant="outline"
                    >
                      <EyeIcon className="size-4 text-muted-foreground" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent arrow={false} className="max-w-72 text-center" side="bottom">
                    {t('reviewModeMessage')}
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="text-sm">
                {course.progress}
                {'%'}
              </span>
              <Progress className="md:max-w-sm" color={progressColor} value={course.completion} />
            </>
          )}
        </>
      )}
    </div>
  )
}
