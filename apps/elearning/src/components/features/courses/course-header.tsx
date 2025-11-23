'use client'

import { useCallback, useMemo, useState } from 'react'

import { ChevronDownIcon, EyeIcon, HistoryIcon, Settings2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { useScroll } from '@/hooks/use-scroll'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const CourseHeader = () => {
  const { course, currentState, saveCourse, settingsOpen, setSettingsOpen, state, step } = useCourse()
  const { localeItems, localize } = useIntl()
  const { scrolled } = useScroll()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const [loading, setLoading] = useState(false)

  const progressColor = course.progress === 100 ? 'success' : 'default'
  const saveLanguageMessage = currentState.canSave ? t('saveDraftTitleRequired') : t('saveDraftNoChanges')

  const handleSave = useCallback(async () => {
    if (!currentState.canSave) return toast.error(saveLanguageMessage)

    try {
      setLoading(true)
      await saveCourse()
      toast.success(t('saveDraftSuccess'))
      setLoading(false)
    } catch {
      toast.error(t('saveDraftError'))
    }
  }, [currentState.canSave, saveCourse, saveLanguageMessage, t])

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
              <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="xs" variant="outline">
                        <Settings2Icon className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center">{t('settings')}</TooltipContent>
                </Tooltip>
                <DialogContent className="gap-6 p-8" size="lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{t('settingsTitle')}</DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                      {localize(course.title)}
                    </DialogDescription>
                  </DialogHeader>
                  <CourseSettings />
                </DialogContent>
              </Dialog>
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="xs" variant="outline">
                        <HistoryIcon className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center">{t('history')}</TooltipContent>
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
            <TabsList className="h-8 w-full sm:w-fit">
              {localeItems.map(({ label, icon, value }) => (
                <TabsTrigger
                  className={cn('relative flex', state[value].hasUpdates && 'text-yellow-600!')}
                  key={value}
                  size="sm"
                  value={value}
                >
                  <span className="group-data-[state=inactive]/tabs-trigger:opacity-60 group-data-[state=inactive]/tabs-trigger:grayscale-40">
                    {label} {icon}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="transition-none"
              disabled={!currentState.canSave}
              loading={loading}
              onClick={handleSave}
              variant="outline"
            >
              {t(currentState.hasUpdates ? 'saveDraft' : 'saveDraftNoChanges')}
            </Button>
          </div>
          <CourseSettingsModal onOpenChange={() => {}} open={false} />
        </>
      ) : (
        <>
          <div className="flex h-full items-center gap-2">
            <span className="pt-1 text-muted-foreground text-sm">
              {t('lessonCount', {
                count: String(step + 1),
                total: String(course.lessons?.length || 0),
              })}
            </span>
          </div>
          {user.isLearner && (
            <>
              {course.progressStatus === 'completed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className="mr-2 cursor-help rounded-full border-muted-foreground/60 p-1.5 text-muted-foreground/90"
                      variant="outline"
                    >
                      <EyeIcon className="size-4 text-muted-foreground" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center" side="bottom">
                    {t('reviewModeMessage')}
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="text-sm">
                {course.progress}
                {'%'}
              </span>
              <Progress className="md:max-w-sm" color={progressColor} value={course.progress} />
            </>
          )}
        </>
      )}
    </div>
  )
}

export const CourseHeaderMobile = () => {
  const { course, language, setStep, step } = useCourse()
  const { localize } = useIntl()
  const { scrolled } = useScroll()
  const t = useTranslations('Courses')

  const currentLesson = useMemo(() => course.lessons?.[step], [course.lessons, step])
  const progressColor = useMemo(() => (course.progress === 100 ? 'success' : 'default'), [course.progress])

  const formatLessonType = useCallback((type: string) => t('lessonType', { type }), [t])

  const isCurrentLesson = useCallback((index: number) => index === step, [step])
  const isCompletedLesson = useCallback((index: number) => !!course.lessons?.[index].completed, [course.lessons])

  return (
    <div className={cn('sticky top-[72px] flex flex-col gap-4 bg-background pb-4 md:hidden', scrolled && 'border-b')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between py-6" variant="outline">
            <div className="flex flex-col items-start">
              {currentLesson ? (
                <>
                  <span className="font-medium">{localize(currentLesson.title, language)}</span>
                  {currentLesson.type && (
                    <span className="text-muted-foreground text-xs">{formatLessonType(currentLesson.type)}</span>
                  )}
                </>
              ) : (
                <span className="font-medium">{'No lessons'}</span>
              )}
            </div>
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {course.lessons ? (
            course.lessons.map((lesson, index) => (
              <DropdownMenuItem className="flex justify-between py-2" key={lesson.id} onClick={() => setStep(index)}>
                <div className="flex flex-col">
                  <span className={cn(isCurrentLesson(index) && 'font-semibold')}>
                    {localize(lesson.title, language)}{' '}
                    {isCompletedLesson(index) && <span className="ml-1 text-success text-xs">{'✔︎'}</span>}
                  </span>
                  {lesson.type && (
                    <span className="text-muted-foreground text-xs">{formatLessonType(lesson.type)}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem className="flex justify-between py-2">
              <div className="flex flex-col">
                <span>{'Add lesson'}</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {course.progressStatus !== 'completed' && (
        <div className="flex items-center justify-end gap-2 bg-background md:top-[72px]">
          <span className="text-sm">
            {course.progress}
            {'%'}
          </span>
          <Progress className="md:max-w-sm" color={progressColor} value={course.progress} />
        </div>
      )}
    </div>
  )
}
