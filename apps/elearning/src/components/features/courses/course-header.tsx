'use client'

import { useCallback, useMemo } from 'react'

import { EyeIcon } from 'lucide-react'

import { COURSE_VIEW_TABS } from '@/components/features/courses/course-view'
import { Badge } from '@/components/ui/badge'
import { LanguageSelect } from '@/components/ui/language-select'
import { MotionTabsList, MotionTabsTrigger } from '@/components/ui/motion-tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useScroll } from '@/hooks/use-scroll'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { type Course } from '@/lib/api/courses/types'
import { type Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

export const CourseHeader = ({
  course,
  language,
  setLanguage,
  step,
  updater,
}: {
  course: Course | Partial<Course>
  language?: Locale
  step: number
  setLanguage: (language: Locale) => void
  updater: (fn: (course: Course) => Course) => void
}) => {
  const { user } = useSession()
  const t = useTranslations('Courses')
  const { scrolled } = useScroll()

  const hasLessons = useMemo(() => course.lessons && course.lessons.length > 0, [course.lessons])
  const progressColor = useMemo(() => (course.completion === 100 ? 'success' : 'default'), [course.completion])
  const published = useMemo(() => course?.publishedLocales ?? [], [course.publishedLocales])
  const draft = useMemo(() => course?.draftLocales ?? [], [course.draftLocales])

  const addLanguage = useCallback(
    (language: Locale) => {
      updater(course => ({
        ...course,
        draftLocales: [...(course.draftLocales || []), language],
      }))
      setLanguage(language)
    },
    [setLanguage, updater],
  )

  const onLanguageChange = useCallback(
    (language: Locale) => {
      setLanguage(language)
    },
    [setLanguage],
  )

  return (
    <div
      className={cn(
        `
          sticky top-36 z-50 hidden w-full grid-cols-1 items-center justify-between gap-2 bg-background px-1 pb-4
          md:top-[72px] md:grid md:grid-cols-[minmax(208px,1fr)_3fr]
        `,
        scrolled && 'border-b',
      )}
    >
      <div className="flex h-full items-end gap-2">
        <span className="pt-1 text-sm text-muted-foreground">
          {hasLessons
            ? t('lessonCount', {
                count: String(step + 1),
                total: String(course.lessons?.length || 0),
              })
            : ''}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
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
        {user.canEdit && (
          <div className="flex items-center gap-2">
            <LanguageSelect
              addLanguage={addLanguage}
              contentProps={{ className: 'min-w-40' }}
              controlled
              onChange={onLanguageChange}
              status={{ published, draft }}
              value={language}
            />
            <MotionTabsList className="w-full sm:w-fit">
              {COURSE_VIEW_TABS.map(tab => (
                <MotionTabsTrigger className="flex items-center gap-1" key={tab} value={tab}>
                  {t(tab)}
                </MotionTabsTrigger>
              ))}
            </MotionTabsList>
            {/* {preview ? (
              <Button className="gap-1" onClick={() => setPreview(false)} title={t('editMessage')} variant="outline">
                <PencilIcon className="size-4" />
                {t('edit')}
              </Button>
            ) : (
              <Button className="gap-1" onClick={() => setPreview(true)} title={t('previewMessage')} variant="outline">
                <EyeIcon className="size-4" />
                {t('preview')}
              </Button>
            )} */}
            {/* {course.publicationStatus === 'draft' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button className="gap-1" variant="success">
                            <RocketIcon className="h-4 w-4" />
                            {t('publish')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent arrow={false} className="max-w-72 text-center" side="bottom">
                          {t('publishCourseMessage')}
                        </TooltipContent>
                      </Tooltip>
                    )} */}
            {/* {course.publicationStatus === 'active' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button className="gap-1" variant="destructive">
                            <RocketIcon className="h-4 w-4" />
                            {t('unpublish')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent arrow={false} className="max-w-72 text-center" side="bottom">
                          {t('unpublishCourseMessage')}
                        </TooltipContent>
                      </Tooltip>
                    )} */}
          </div>
        )}
      </div>
    </div>
  )
}
