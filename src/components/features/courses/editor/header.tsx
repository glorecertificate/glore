'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  CheckCircle2Icon,
  ChevronDownIcon,
  EyeIcon,
  GlobeIcon,
  HistoryIcon,
  SaveAllIcon,
  SaveIcon,
  SettingsIcon,
  UploadCloudIcon,
} from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { type CourseStatus, useCourse } from '@/components/features/courses/editor/context'
import { CourseSettings } from '@/components/features/courses/editor/settings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Lesson } from '@/db/queries/lesson'
import { useI18n } from '@/hooks/use-i18n'
import { useScroll } from '@/hooks/use-scroll'
import { useSession } from '@/hooks/use-session'
import { localizeRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SaveAllDialog = ({
  onSave,
  status,
  publishedLanguages,
}: {
  onSave: (languages: Locale[]) => Promise<void>
  status: Record<Locale, CourseStatus>
  publishedLanguages: Locale[]
}) => {
  const { localeItems } = useI18n()
  const t = useTranslations('Courses')

  const [open, setOpen] = useState(false)
  const [publishStates, setPublishStates] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(false)

  const hasAnyChanges = useMemo(() => Object.values(status).some(s => s.hasUpdates), [status])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        const initial: Record<string, boolean> = {}
        for (const item of localeItems) {
          initial[item.value] = publishedLanguages.includes(item.value)
        }
        setPublishStates(initial)
      }
      setOpen(isOpen)
    },
    [localeItems, publishedLanguages]
  )

  const handleToggle = useCallback((locale: string, checked: boolean) => {
    setPublishStates(prev => ({ ...prev, [locale]: checked }))
  }, [])

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true)
      const languages = Object.entries(publishStates)
        .filter(([, published]) => published)
        .map(([locale]) => locale as Locale)
      await onSave(languages)
      toast.success(t('saveAllSuccess'))
      setOpen(false)
    } catch {
      toast.error(t('saveAllError'))
    } finally {
      setLoading(false)
    }
  }, [onSave, publishStates, t])

  const hasToggleChanges = useMemo(
    () => localeItems.some(item => publishStates[item.value] !== publishedLanguages.includes(item.value)),
    [localeItems, publishedLanguages, publishStates]
  )

  const canConfirm = hasAnyChanges || hasToggleChanges

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button disabled={!hasAnyChanges} size="xs" variant="outline">
              <SaveAllIcon className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{hasAnyChanges ? t('saveAll') : t('saveDraftNoChanges')}</TooltipContent>
      </Tooltip>

      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SaveAllIcon className="size-5" />
            {t('saveAll')}
          </DialogTitle>
          <DialogDescription>{t('saveAllDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {localeItems.map(item => {
            const localeStatus = status[item.value]
            const isPublished = publishStates[item.value] ?? false
            const canPublish = localeStatus.isFulfilled

            return (
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                  localeStatus.hasUpdates && 'border-warning/40 bg-warning/5'
                )}
                key={item.value}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {localeStatus.hasUpdates ? t('hasChanges') : t('noChanges')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={cn('font-medium text-xs', isPublished ? 'text-success' : 'text-muted-foreground')}>
                    {isPublished ? t('published') : t('draft')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={isPublished}
                          disabled={!(canPublish || isPublished)}
                          onCheckedChange={checked => handleToggle(item.value, checked)}
                        />
                      </span>
                    </TooltipTrigger>
                    {!(canPublish || isPublished) && (
                      <TooltipContent className="max-w-56 text-center" side="left">
                        {t('cannotPublishIncomplete')}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">{t('publishedInfo')}</p>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button disabled={!canConfirm} loading={loading} onClick={handleConfirm}>
            <SaveAllIcon className="size-4" />
            {t('saveAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const CourseHeader = () => {
  const router = useRouter()
  const { scrolled } = useScroll()

  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const { user } = useSession()
  const { course, language, languageStatus, status, step, saveCourse } = useCourse()

  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savingPublished, setSavingPublished] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const progressColor = course.progress === 100 ? 'success' : 'default'

  const canSaveDraft = languageStatus.hasUpdates

  const handleSave = useCallback(async () => {
    if (!canSaveDraft) return
    try {
      setSavingDraft(true)
      await saveCourse()
      toast.success(t('saveDraftSuccess'))
    } catch {
      toast.error(t('saveDraftError'))
    } finally {
      setSavingDraft(false)
    }
  }, [canSaveDraft, saveCourse, t])

  const handlePublish = useCallback(async () => {
    if (!languageStatus.isFulfilled) return
    try {
      setPublishing(true)
      const existing = course.languages ?? []
      const merged = [...new Set([...existing, language])]
      await saveCourse({ languages: merged })
      toast.success(t('publishSuccess'))
    } catch {
      toast.error(t('publishError'))
    } finally {
      setPublishing(false)
    }
  }, [languageStatus.isFulfilled, saveCourse, course.languages, language, t])

  const handleSavePublished = useCallback(async () => {
    if (!(languageStatus.isFulfilled && languageStatus.hasUpdates)) return
    try {
      setSavingPublished(true)
      await saveCourse()
      toast.success(t('saveDraftSuccess'))
    } catch {
      toast.error(t('saveDraftError'))
    } finally {
      setSavingPublished(false)
    }
  }, [languageStatus.isFulfilled, languageStatus.hasUpdates, saveCourse, t])

  const handleSaveAll = useCallback(
    async (languages: Locale[]) => {
      await saveCourse({ languages })
    },
    [saveCourse]
  )

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
              <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
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
                    <DialogDescription>{t('courseSettingsDescription')}</DialogDescription>
                  </DialogHeader>
                  <CourseSettings
                    course={course}
                    onError={error => {
                      console.error(error.message)
                      toast.error(t('courseCreationFailed'))
                    }}
                    onSuccess={updated => {
                      toast.success(t('courseSettingsUpdated'))
                      setSettingsOpen(false)
                      if (updated.slug !== course.slug) {
                        router.replace(`/courses/${updated.slug}?lesson=${step}&lang=${language}`)
                      }
                    }}
                  />
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
              <SaveAllDialog onSave={handleSaveAll} publishedLanguages={course.languages ?? []} status={status} />
            </div>
            <TabsList className="h-8 w-full sm:w-fit">
              {localeItems.map(({ label, icon, value }) => (
                <TabsTrigger
                  className={cn('relative flex', status[value].hasUpdates && 'text-yellow-600!')}
                  key={value}
                  size="sm"
                  value={value}
                >
                  <span className="group-data-[status=inactive]/tabs-trigger:opacity-60 group-data-[status=inactive]/tabs-trigger:grayscale-40">
                    {label} {icon}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex items-center gap-2">
            {/* Save draft button — enabled only when there are changes */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="transition-none"
                  disabled={!canSaveDraft}
                  loading={savingDraft}
                  loadingSpinner="sm"
                  onClick={handleSave}
                  variant="outline"
                >
                  <SaveIcon />
                  {t('saveDraft')}
                </Button>
              </TooltipTrigger>
              {!canSaveDraft && <TooltipContent>{t('saveDraftNoChanges')}</TooltipContent>}
            </Tooltip>

            {languageStatus.published ? (
              languageStatus.hasUpdates ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="transition-none"
                      disabled={!languageStatus.isFulfilled}
                      loading={savingPublished}
                      loadingSpinner="sm"
                      onClick={handleSavePublished}
                    >
                      <CheckCircle2Icon className="size-4" />
                      {t('save')}
                    </Button>
                  </TooltipTrigger>
                  {!languageStatus.isFulfilled && (
                    <TooltipContent className="max-w-64 text-center">{t('publishDisabledMessage')}</TooltipContent>
                  )}
                </Tooltip>
              ) : (
                <Badge className="gap-1.5 px-3 py-1.5" variant="outline">
                  <GlobeIcon className="size-3.5" />
                  {t('published')}
                </Badge>
              )
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="transition-none"
                    disabled={!languageStatus.isFulfilled}
                    loading={publishing}
                    loadingSpinner="sm"
                    onClick={handlePublish}
                  >
                    <UploadCloudIcon className="size-4" />
                    {t('publish')}
                  </Button>
                </TooltipTrigger>
                {!languageStatus.isFulfilled && (
                  <TooltipContent className="max-w-64 text-center">{t('publishDisabledMessage')}</TooltipContent>
                )}
              </Tooltip>
            )}
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
  const { course, currentLesson, language, setStep, step } = useCourse()
  const { scrolled } = useScroll()
  const t = useTranslations('Courses')

  const progressColor = useMemo(() => (course.progress === 100 ? 'success' : 'default'), [course.progress])

  const lessonType = useCallback((lesson: Lesson) => t('lessonType', { type: lesson.type }), [t])
  const isCurrentLesson = useCallback((index: number) => index === step, [step])
  const isCompletedLesson = useCallback((index: number) => course.lessons[index].completed, [course.lessons])

  return (
    <div className={cn('flex flex-col gap-4 bg-background pb-4', scrolled && 'border-b', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between py-6" variant="outline">
            <div className="flex flex-col items-start">
              {currentLesson ? (
                <>
                  {currentLesson.title && (
                    <span className="font-medium">{localizeRecord(currentLesson.title, language)}</span>
                  )}
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
          {course.lessons.length > 0 ? (
            course.lessons.map((lesson, index) => (
              <DropdownMenuItem
                className="flex justify-between py-2"
                key={lesson.id}
                onClick={() => setStep(index + 1)}
              >
                <div className="flex flex-col">
                  <span className={cn(isCurrentLesson(index) && 'font-semibold')}>
                    {lesson.title && localizeRecord(lesson.title, language)}{' '}
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
