'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { ChevronDownIcon, EyeIcon, HistoryIcon, SaveIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourse } from '@/components/features/courses/course-provider'
import { CourseSettings, type CourseSettingsForm } from '@/components/features/courses/course-settings'
import { useSession } from '@/components/providers/session-provider'
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
import { type Lesson } from '@/db/schema/lessons'
import { postgrestError } from '@/db/utils'
import { useI18n } from '@/hooks/use-i18n'
import { useScroll } from '@/hooks/use-scroll'
import { localize } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const CourseHeader = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { scrolled } = useScroll()

  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const { user } = useSession()
  const { course, currentLanguageState, editCourse, saveCourse, state, step } = useCourse()

  const [loading, setLoading] = useState(false)

  const progressColor = course.progress === 100 ? 'success' : 'default'
  const saveLanguageMessage = currentLanguageState.canSave ? t('saveDraftTitleRequired') : t('saveDraftNoChanges')

  const updateSettings = useCallback(
    async (form: CourseSettingsForm) => {
      try {
        const currentSlug = course.slug
        const { slug } = await editCourse(form.getValues())
        toast.success(t('courseSettingsUpdated'))
        if (slug !== currentSlug) {
          router.replace(`/courses/${slug}?${searchParams.toString()}`)
        }
      } catch (e) {
        const error = postgrestError(e)
        console.error(error.message)
        if (error.code === '23505') {
          form.setError('slug', { message: t('courseSlugTaken') })
          form.setFocus('slug')
          return
        }
        toast.error(t('courseCreationFailed'))
      }
    },
    [course.slug, editCourse, router.replace, t, searchParams.toString]
  )

  const handleSave = useCallback(async () => {
    if (!currentLanguageState.canSave) return toast.error(saveLanguageMessage)

    try {
      setLoading(true)
      await saveCourse()
      toast.success(t('saveDraftSuccess'))
      setLoading(false)
    } catch {
      toast.error(t('saveDraftError'))
    }
  }, [currentLanguageState.canSave, saveCourse, saveLanguageMessage, t])

  return (
    <div
      className={cn(
        'sticky top-36 z-50 hidden w-full items-center justify-between gap-2 bg-background px-1 pb-4 md:top-18 md:flex',
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
                        <SettingsIcon className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center" sideOffset={6}>
                    {t('settings')}
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="gap-6 p-8" size="lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <SettingsIcon className="size-5" />
                      {t('settings')}
                    </DialogTitle>
                    <DialogDescription />
                  </DialogHeader>
                  <CourseSettings course={course} onSubmit={updateSettings} />
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
                  <TooltipContent className="max-w-72 text-center" sideOffset={6}>
                    {t('history')}
                  </TooltipContent>
                </Tooltip>
                <DialogContent size="lg">
                  <DialogHeader className="flex-row items-center gap-2">
                    <HistoryIcon className="size-5" />
                    <DialogTitle>{t('history')}</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="mb-4 text-muted-foreground text-sm">
                    {tCommon('comingSoonFeature')}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="transition-none"
                  disabled={!currentLanguageState.canSave}
                  loading={loading}
                  onClick={handleSave}
                  variant="outline"
                >
                  <SaveIcon />
                  {t('saveDraft')}
                </Button>
              </TooltipTrigger>
              {!currentLanguageState.hasUpdates && <TooltipContent>{t('saveDraftNoChanges')}</TooltipContent>}
            </Tooltip>
          </div>
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

export const CourseHeaderMobile = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { course, lessons, currentLesson, language, setStep, step } = useCourse()
  const { scrolled } = useScroll()
  const t = useTranslations('Courses')

  const progressColor = useMemo(() => (course.progress === 100 ? 'success' : 'default'), [course.progress])

  const lessonType = useCallback((lesson: Lesson) => t('lessonType', { type: lesson.type }), [t])
  const isCurrentLesson = useCallback((index: number) => index === step, [step])
  const isCompletedLesson = useCallback((index: number) => lessons[index].completed, [lessons])

  return (
    <div className={cn('flex flex-col gap-4 bg-background pb-4', scrolled && 'border-b', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between py-6" variant="outline">
            <div className="flex flex-col items-start">
              {currentLesson ? (
                <>
                  <span className="font-medium">{localize(currentLesson.title, language)}</span>
                  <span className="text-muted-foreground text-xs">{lessonType(currentLesson)}</span>
                </>
              ) : (
                <span className="font-medium">{'No lessons'}</span>
              )}
            </div>
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <DropdownMenuItem
                className="flex justify-between py-2"
                key={lesson.id}
                onClick={() => setStep(index + 1)}
              >
                <div className="flex flex-col">
                  <span className={cn(isCurrentLesson(index) && 'font-semibold')}>
                    {localize(lesson.title, language)}{' '}
                    {isCompletedLesson(index) && <span className="ml-1 text-success text-xs">{'✔︎'}</span>}
                  </span>
                  <span className="text-muted-foreground text-xs">{lessonType(lesson)}</span>
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
        <div className="flex items-center justify-end gap-2 bg-background md:top-18">
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
