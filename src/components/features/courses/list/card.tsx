'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BookOpenIcon, Edit3Icon, LanguagesIcon, LinkIcon, UserPenIcon } from 'lucide-react'
import { type Locale, useFormatter, useTranslations } from 'next-intl'

import { CourseCardActions } from '@/components/features/courses/list/card-actions'
import { courseTypeVariants } from '@/components/features/courses/list/type-select'
import { UserCard } from '@/components/features/users/user-card'
import { LucideIcon } from '@/components/icons/lucide'
import { useCourses } from '@/components/providers/courses-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { IconPicker } from '@/components/ui/icon-picker'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { useCookies } from '@/hooks/use-cookies'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { i18n, localizeRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CourseListCard = memo(
  ({
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
    const f = useFormatter()
    const cookies = useCookies()

    const { user } = useSession()
    const { updateCourse } = useCourses()

    const updateCourseRef = useRef(updateCourse)
    useEffect(() => {
      updateCourseRef.current = updateCourse
    }, [updateCourse])

    const updateCourseIcon = useCallback((icon: IconName) => updateCourseRef.current(course.id, { icon }), [course.id])

    const [language, setLanguageState] = useState(() => {
      const courseLanguages = cookies.get('courseListLanguages') ?? {}
      const courseLanguage = courseLanguages[course.id]
      if (courseLanguage && activeLanguages.includes(courseLanguage)) return courseLanguage
      if (activeLanguages.includes(locale)) return locale
      return activeLanguages[0]
    })
    const [isRemoving, setIsRemoving] = useState(false)

    const setLanguage = useCallback(
      (value: Locale) => {
        if (value === language || !activeLanguages.includes(value)) return
        setLanguageState(value)
        const languageCookie = cookies.get('courseListLanguages') ?? {}
        cookies.set('courseListLanguages', { ...languageCookie, [course.id]: value })
      },
      [activeLanguages, cookies, course.id, language]
    )

    useEffect(() => {
      if (!activeLanguages.includes(language)) {
        setLanguage(activeLanguages[0])
      }
    }, [activeLanguages, language, setLanguage])

    const title = useMemo(() => localizeRecord(course.title, language), [course.title, language])
    const coursePath = `/courses/${course.slug}?lang=${language}` as const
    const completedLessons = useMemo(
      () => course.lessons?.filter(lesson => lesson.completed).length ?? 0,
      [course.lessons]
    )
    const lessonsMessage =
      course.lessons.length > 0
        ? `${course.lessons.length} ${t('lessons', { count: course.lessons.length })}`
        : t('noLessonsCreated')
    const createdOn = t('createdOnBy', { date: f.relativeTime(new Date(course.created_at), Date.now()) })

    const languageItems = useMemo(
      () =>
        localeItems
          .filter(({ value }) => activeLanguages.includes(value))
          .map(item => ({
            ...item,
            active: item.value === language,
            published: !!course.languages && course.languages.includes(item.value),
          }))
          .sort((a, b) => i18n.locales.indexOf(a.value) - i18n.locales.indexOf(b.value)),
      [activeLanguages, course.languages, language, localeItems]
    )

    const description = useMemo(() => {
      const translation = localizeRecord(course.description, language)
      if (!translation) return
      const courseDescription = `${translation.split('.')[0]}.`

      return translation.length > courseDescription.length ? (
        <>
          {courseDescription}
          <Tooltip>
            <TooltipTrigger className="ml-1 inline-block cursor-help text-[10px] text-muted-foreground/80">
              {t('cardDescriptionMore')}
            </TooltipTrigger>
            <TooltipContent className="max-w-75 text-sm" side="bottom" sideOffset={4}>
              {translation}
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        courseDescription
      )
    }, [course.description, t, language])

    const actionLabel = useMemo(() => {
      if (user.canEdit) return t('editCourse')
      if (!course.enrolled) return t('startCourse')
      if (course.completed) return t('reviewCourse')
      return t('continueCourse')
    }, [course.completed, course.enrolled, t, user.canEdit])

    const handleRemove = useCallback(() => setIsRemoving(true), [])

    return (
      <Card
        className={cn(
          'min-h-80 transition-all duration-200',
          isRemoving && 'pointer-events-none scale-95 opacity-0',
          className
        )}
        {...props}
      >
        <CardHeader className="gap-4">
          {user.canEdit ? (
            <div className="flex grow flex-col gap-3">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1">
                  <Tooltip delayDuration={500}>
                    <TooltipTrigger asChild>
                      <IconPicker
                        categorized={false}
                        className="peer size-7 rounded-full bg-muted/50 stroke-muted-foreground/80 p-0 hover:bg-muted! hover:text-accent-foreground data-[state=open]:bg-muted!"
                        onValueChange={updateCourseIcon}
                        value={course.icon}
                        variant="ghost"
                      />
                    </TooltipTrigger>
                    <span className="not:peer-data-[state=open]:invisible">
                      <TooltipContent size="sm">{course.icon ? t('updateIcon') : t('addIcon')}</TooltipContent>
                    </span>
                  </Tooltip>
                  <Link
                    className={cn('font-medium leading-[normal] transition-none')}
                    href={coursePath}
                    prefetch
                    title={t('viewCourse')}
                  >
                    {title}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="size-2.5" />
                  <Link
                    className="font-mono text-[11px] text-muted-foreground"
                    href={coursePath}
                    title={t('followLink')}
                  >
                    {course.slug}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={cn('py-0.5', courseTypeVariants({ type: course.type }))} variant="ghost">
                  {t(`courseType-${course.type}`)}
                </Badge>
                {course.skill_group && <Badge>{localizeRecord(course.skill_group.name, language)}</Badge>}
              </div>
            </div>
          ) : (
            <div className="flex grow flex-col gap-3">
              <div className="flex gap-2">
                <LucideIcon
                  className="size-8 shrink-0 rounded-full bg-muted/50 stroke-muted-foreground/80 hover:bg-muted! hover:text-accent-foreground data-[state=open]:bg-muted!"
                  name={course.icon}
                />
                <Link
                  className={cn('font-medium leading-[normal] transition-none')}
                  href={coursePath}
                  prefetch
                  title={t('viewCourse')}
                >
                  {title}
                </Link>
                {course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Badge className={cn('py-0.5', courseTypeVariants({ type: course.type }))} variant="ghost">
                  {t(`courseType-${course.type}`)}
                </Badge>
                {course.skill_group && <Badge>{localizeRecord(course.skill_group.name, language)}</Badge>}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="mb-0.5">
          <p className={cn('text-sm', description ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
            {description ?? t('noDescription')}
          </p>
        </CardContent>
        <CardFooter className="flex grow flex-col justify-end gap-4">
          <div className="flex flex-col gap-2">
            {/* Drafts */}
            {user.canEdit && languageItems.length > 1 && (
              <div className="flex items-center gap-2.5 font-normal text-muted-foreground text-xs">
                <LanguagesIcon className="size-3.5 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {languageItems.map(({ active, displayLabel, icon, published, value }) => (
                    <div className="flex flex-col items-center gap-0" key={value}>
                      <Tooltip delayDuration={500}>
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
                            {published && (
                              <div className="absolute -bottom-1.25 size-1 animate-pulse rounded-full bg-success" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={2} size="sm">
                          {t(published ? 'previewIn' : 'previewDraftIn', { lang: displayLabel })}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div
              className={cn(
                'flex items-center gap-2.5 font-normal text-xs',
                course.lessons.length > 0
                  ? 'text-muted-foreground'
                  : 'pointer-events-none select-none text-muted-foreground/50'
              )}
            >
              <BookOpenIcon className="size-3.5 text-muted-foreground" />
              {lessonsMessage}
            </div>
            {user.canEdit && (
              <div className="flex select-none items-center gap-2.5 font-normal text-muted-foreground text-xs">
                <UserPenIcon className="size-3.5 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <span suppressHydrationWarning>{createdOn}</span>
                  <HoverCard closeDelay={50} openDelay={300}>
                    <HoverCardTrigger asChild>
                      <Button
                        className={
                          'peer/user-card cursor-default gap-1 pr-0.5 font-normal text-muted-foreground text-xs data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground dark:data-[state=open]:bg-accent/50'
                        }
                        size="text"
                        variant="ghost"
                      >
                        <Avatar className="size-4 rounded-full border">
                          {course.creator.avatar_url && (
                            <AvatarImage className="rounded-full" src={course.creator.avatar_url} />
                          )}
                          <AvatarFallback className="text-[7.5px]">{course.creator.initials}</AvatarFallback>
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
            <div className="flex select-none items-center gap-2.5 font-normal text-muted-foreground text-xs">
              <Edit3Icon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <span>{t('writtenBy')}</span>
                <div className="flex -space-x-0.5 hover:space-x-1">
                  {course.contributors.map(contributor => (
                    <HoverCard closeDelay={50} key={contributor.id} openDelay={300}>
                      <HoverCardTrigger asChild>
                        <Avatar className="size-4 rounded-full border ring-background transition-all duration-200 ease-in-out">
                          {contributor.avatar_url && (
                            <AvatarImage className="rounded-full" src={contributor.avatar_url} />
                          )}
                          <AvatarFallback className="text-[7.5px]">{contributor.initials}</AvatarFallback>
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
          </div>
          {!user.canEdit && course.enrolled && (
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-muted-foreground text-sm">
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
            <ButtonGroup className="w-full">
              <Button asChild className="flex-1" variant="outline">
                <Link href={coursePath}>{actionLabel}</Link>
              </Button>
              <CourseCardActions course={course} onRemove={handleRemove} />
            </ButtonGroup>
          ) : (
            <Button asChild className="w-full" variant="outline">
              <Link href={coursePath}>{actionLabel}</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }
)
