'use client'

import { useEffect, useRef } from 'react'

import { ArchiveIcon, BookOpenIcon, Edit3Icon, LanguagesIcon, LinkIcon, UserPenIcon, UsersIcon } from 'lucide-react'
import { type Locale, useFormatter, useNow, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourses } from '@/components/features/courses/context'
import { resolveCourseLanguage, useCourseLanguages } from '@/components/features/courses/course-languages'
import { CourseCardActions } from '@/components/features/courses/course-list/card-actions'
import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { useCourseListSearch, useCourseListTab } from '@/components/features/courses/course-list/use-params'
import { UserCard } from '@/components/features/users/user-card'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { IconPicker } from '@/components/ui/icon-picker'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { SearchHighlight } from '@/components/ui/search'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { LOCALES, localizeRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CourseListCard = ({
  activeLanguages,
  className,
  course,
  ...props
}: React.ComponentProps<typeof Card> & {
  activeLanguages: Locale[]
  course: Course
}) => {
  const { locale, localeItems } = useI18n()
  const t = useTranslations('Courses')
  const { relativeTime } = useFormatter()
  const now = useNow({ updateInterval: 60_000 })
  const { tab } = useCourseListTab()
  const { search } = useCourseListSearch()
  const { languages: cardLanguages, setLanguage: setCardLanguage } = useCourseLanguages()

  const { user } = useSession()
  const { updateCourse } = useCourses()

  const updateCourseRef = useRef(updateCourse)
  useEffect(() => {
    updateCourseRef.current = updateCourse
  }, [updateCourse])

  const updateCourseIcon = async (icon: IconName) => {
    const result = await updateCourseRef.current(course.id, { icon })
    if ('error' in result) return
    toast.success(t('iconUpdateSuccess'))
  }

  const language = resolveCourseLanguage(cardLanguages, course.id, { activeLanguages, fallback: locale })
  const setLanguage = (value: Locale) => {
    if (value === language || !activeLanguages.includes(value)) return
    setCardLanguage(course.id, value)
  }

  const title = localizeRecord(course.title, language)
  const coursePath = `/courses/${course.slug}?lang=${language}` as const
  const completedLessons = course.lessons?.filter(lesson => lesson.completed).length ?? 0
  const lessonsMessage =
    course.lessons.length > 0
      ? `${course.lessons.length} ${t('lessons', { count: course.lessons.length })}`
      : t('noLessonsCreated')
  const createdOn = t('createdOnBy', { date: relativeTime(new Date(course.createdAt), now) })

  const activeSet = new Set(activeLanguages)
  const publishedSet = new Set(course.languages ?? [])
  const languageItems: Array<(typeof localeItems)[number] & { active: boolean; published: boolean }> = []
  for (const item of localeItems) {
    if (!activeSet.has(item.value)) continue
    languageItems.push({
      ...item,
      active: item.value === language,
      published: publishedSet.has(item.value),
    })
  }
  languageItems.sort((a, b) => LOCALES.indexOf(a.value) - LOCALES.indexOf(b.value))

  const description = (() => {
    const translation = course.description ? localizeRecord(course.description, language) : undefined
    if (!translation) return
    const courseDescription = `${translation.split('.')[0]}.`

    return translation.length > courseDescription.length ? (
      <>
        <SearchHighlight query={search} value={courseDescription} />
        <Tooltip>
          <TooltipTrigger className="ml-1 inline-block cursor-help text-[10px] text-muted-foreground/80">
            {t('cardDescriptionMore')}
          </TooltipTrigger>
          <TooltipContent className="max-w-75 text-sm" side="bottom" sideOffset={4}>
            <SearchHighlight query={search} value={translation} />
          </TooltipContent>
        </Tooltip>
      </>
    ) : (
      <SearchHighlight query={search} value={courseDescription} />
    )
  })()

  const actionLabel = (() => {
    if (user.canEdit) return t('editCourse')
    if (user.isOrgAdmin || user.isRepresentative || user.isTutor) return t('viewCourse')
    if (!course.enrolled) return t('startCourse')
    if (course.completed) return t('reviewCourse')
    return t('continueCourse')
  })()

  return (
    <Card className={cn('min-h-80', className)} {...props}>
      <CardHeader className="gap-12">
        {user.canEdit ? (
          <div className="flex grow flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <IconPicker
                      className={cn(
                        'peer -ml-0.5 size-7 rounded-full p-0',
                        courseIconVariants({ background: true, type: course.type })
                      )}
                      onValueChange={updateCourseIcon}
                      value={(course.icon ?? undefined) as IconName | undefined}
                      variant="ghost"
                    />
                  </TooltipTrigger>
                  <span className="peer-data-[state=open]:invisible">
                    <TooltipContent size="sm">{course.icon ? t('updateIcon') : t('addIcon')}</TooltipContent>
                  </span>
                </Tooltip>
                <Link
                  className={cn('leading-[normal] font-medium transition-none')}
                  href={coursePath}
                  prefetch
                  title={t('viewCourse')}
                >
                  <SearchHighlight query={search} value={title} />
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <LinkIcon className="size-2.5" />
                <Link className="font-mono text-[11px] text-muted-foreground" href={coursePath} title={t('followLink')}>
                  {'/'}
                  <SearchHighlight query={search} value={course.slug} />
                </Link>
              </div>
            </div>
            {course.skillGroup && (
              <div className="flex items-center gap-1">
                <Badge variant="outline">{localizeRecord(course.skillGroup.name, language)}</Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="flex grow flex-col gap-3">
            <div className="flex gap-1.5">
              {course.icon && (
                <LucideIcon
                  className={cn(
                    'size-8 shrink-0 rounded-full',
                    courseIconVariants({ background: true, type: course.type })
                  )}
                  name={course.icon as IconName}
                />
              )}
              <Link
                className={cn('leading-[normal] font-medium transition-none')}
                href={coursePath}
                prefetch
                title={t('viewCourse')}
              >
                <SearchHighlight query={search} value={title} />
              </Link>
              {course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
            </div>
            {course.skillGroup && (
              <div className="flex items-center gap-1">
                <Badge variant="outline">{localizeRecord(course.skillGroup.name, language)}</Badge>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="mb-0.5">
        <p className={cn('text-sm', description ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
          {description ?? t('noDescription')}
        </p>
      </CardContent>
      <CardFooter className="flex grow flex-col justify-end gap-5">
        <div className="flex flex-col gap-2.5">
          {/* Drafts */}
          {user.canEdit && languageItems.length > 1 && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
              <LanguagesIcon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                {languageItems.map(({ active, displayLabel, icon, published, value }) => (
                  <div className="flex flex-col items-center gap-0" key={value}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          className={cn('relative text-base', active && 'pointer-events-none cursor-default')}
                          onClick={() => {
                            if (!active) {
                              setLanguage(value)
                            }
                          }}
                          size="text"
                          variant="transparent"
                        >
                          <span className={cn('flex h-3 items-center', !active && 'opacity-50')}>{icon}</span>
                          {published && tab !== 'archived' && (
                            <div className="absolute -bottom-1.25 size-1 animate-pulse rounded-full bg-success" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={8} size="sm">
                        {t('previewIn', { lang: displayLabel })}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-2.5 text-xs font-normal',
              course.lessons.length > 0
                ? 'text-muted-foreground'
                : 'pointer-events-none text-muted-foreground/50 select-none'
            )}
          >
            <BookOpenIcon className="size-3.5 text-muted-foreground" />
            {lessonsMessage}
          </div>
          {user.canEdit && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground select-none">
              <UserPenIcon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <span suppressHydrationWarning>{createdOn}</span>
                <HoverCard closeDelay={50} openDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button
                      className="peer/user-card cursor-default gap-1 rounded-xl pr-0.5 text-xs font-normal text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground dark:hover:bg-accent/50 dark:data-[state=open]:bg-accent/50"
                      size="text"
                      variant="ghost"
                    >
                      <Avatar className="size-4.75 rounded-full border">
                        {course.creator.avatarUrl && (
                          <AvatarImage className="rounded-full" src={course.creator.avatarUrl} />
                        )}
                        <AvatarFallback className="text-[8.5px]">{course.creator.initials}</AvatarFallback>
                      </Avatar>
                      {course.creator.shortName}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-popover" side="top">
                    <UserCard user={course.creator} />
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          )}
          {user.canEdit && course.enrollmentCount > 0 && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground select-none">
              <UsersIcon className="size-3.5 text-muted-foreground" />
              {t('enrolledStudents', { count: course.enrollmentCount })}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground select-none">
            <Edit3Icon className="size-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <span>{t('writtenBy')}</span>
              <div className="flex -space-x-0.5 hover:space-x-1">
                {course.contributors.map(contributor => (
                  <HoverCard closeDelay={50} key={contributor.id} openDelay={300}>
                    <HoverCardTrigger asChild>
                      <Avatar className="size-4.75 rounded-full border ring-background transition-all duration-200 ease-in-out">
                        {contributor.avatarUrl && <AvatarImage className="rounded-full" src={contributor.avatarUrl} />}
                        <AvatarFallback className="text-[8.5px]">{contributor.initials}</AvatarFallback>
                      </Avatar>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-popover" side="top">
                      <UserCard user={contributor} />
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          </div>
          {tab === 'archived' && course.archivedAt && course.archivedBy && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground select-none">
              <ArchiveIcon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <span suppressHydrationWarning>
                  {t('archivedOnBy', { date: relativeTime(new Date(course.archivedAt), now) })}
                </span>
                <HoverCard closeDelay={50} openDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button
                      className="peer/archived-by-card cursor-default gap-1 rounded-xl pr-0.5 text-xs font-normal text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground dark:hover:bg-accent/50 dark:data-[state=open]:bg-accent/50"
                      size="text"
                      variant="ghost"
                    >
                      <Avatar className="size-4.75 rounded-full border">
                        {course.archivedBy.avatarUrl && (
                          <AvatarImage className="rounded-full" src={course.archivedBy.avatarUrl} />
                        )}
                        <AvatarFallback className="text-[8.5px]">{course.archivedBy.initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-popover" side="top">
                    <UserCard user={course.archivedBy} />
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          )}
        </div>
        {!user.canEdit && course.enrolled && (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                {completedLessons}
                {' / '}
                {course.lessons.length} {t('lessons', { count: course.lessons.length })}
              </span>
              <span>
                {course.progress}
                {'% '}
                {t('completed').toLowerCase()}
              </span>
            </div>
            <Progress className="h-1.5" value={course.progress} />
          </div>
        )}
        {user.canEdit ? (
          <CourseCardActions actionLabel={actionLabel} course={course} coursePath={coursePath} />
        ) : (
          <Button asChild className="w-full" variant="outline">
            <Link href={coursePath}>{actionLabel}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
