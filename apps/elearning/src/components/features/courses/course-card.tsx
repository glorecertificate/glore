'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ArchiveIcon,
  BookOpenIcon,
  Edit3Icon,
  LanguagesIcon,
  LinkIcon,
  MoreHorizontalIcon,
  RocketIcon,
  Trash2Icon,
  UserPenIcon,
} from 'lucide-react'
import { type IconName } from 'lucide-react/dynamic'
import { type Locale, useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { UserCard } from '@/components/features/users/user-card'
import { DynamicIcon } from '@/components/icons/dynamic'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { type Course, DEFAULT_COURSE_TITLE } from '@/lib/data'
import { type IntlRecord, type LocaleItem } from '@/lib/intl'
import { buildRoute } from '@/lib/navigation'
import { cookies } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface LanguageItem extends LocaleItem {
  active: boolean
  published: boolean
  setLanguage: (value: Locale) => void
}

const CourseCardLanguage = ({
  active,
  className,
  displayLabel,
  icon,
  published,
  setLanguage,
  showState = true,
  value,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> &
  LanguageItem & {
    showState?: boolean
  }) => {
  const t = useTranslations('Courses')

  const handleClick = useCallback(() => {
    if (active) return
    setLanguage(value)
  }, [active, setLanguage, value])

  const button = (
    <Button
      className={cn('text-base leading-none', active ? 'pointer-events-none cursor-default' : 'opacity-50', className)}
      onClick={handleClick}
      size="text"
      variant="transparent"
      {...props}
    >
      {icon}
    </Button>
  )

  if (!showState) return button

  return (
    <div className="flex flex-col items-center gap-0">
      <Tooltip delayDuration={300} disableHoverableContent>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent arrow={false} sideOffset={2} size="sm">
          {t(published ? 'previewIn' : 'previewDraftIn', { lang: displayLabel })}
        </TooltipContent>
      </Tooltip>
      {showState && <div className={cn('size-1 rounded-full', published ? 'bg-success' : 'bg-warning/90')} />}
    </div>
  )
}

export const CourseCard = ({
  activeLanguages,
  course,
  showState = true,
}: {
  activeLanguages: Locale[]
  course: Course & {
    language: Locale
  }
  showState?: boolean
}) => {
  const { locale, localeItems, locales, localize } = useI18n()
  const { user, updateCourse, deleteCourse: deleteSessionCourse } = useSession()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')
  const f = useFormatter()

  const [language, setLanguage] = useState(course.language)

  const translate = useCallback((record: IntlRecord) => localize(record, language), [localize, language])

  const updateLanguage = useCallback(
    (value: Locale) => {
      if (value === language) return
      setLanguage(value)
      const languageCookie = cookies.get('course-locale') || {}
      languageCookie[course.slug] = value
      cookies.set('course-locale', languageCookie)
    },
    [course.slug, language]
  )

  const getCoursePath = useCallback(
    (lang: Locale) => buildRoute('/courses/[slug]', { slug: course.slug }, { lang }),
    [course.slug]
  )

  const coursePath = useMemo(() => getCoursePath(language), [getCoursePath, language])

  const languageItems = useMemo(
    () =>
      localeItems
        .reduce(
          (items, item) =>
            activeLanguages.includes(item.value)
              ? [
                  ...items,
                  {
                    ...item,
                    active: item.value === language,
                    published: course.languages.includes(item.value),
                    setLanguage: updateLanguage,
                  },
                ]
              : items,
          [] as LanguageItem[]
        )
        .sort((a, b) => locales.indexOf(a.value) - locales.indexOf(b.value)),
    [activeLanguages, course.languages, language, localeItems, locales, updateLanguage]
  )

  const title = useMemo(() => translate(course.title), [course.title, translate])
  const isDefaultTitle = useMemo(() => title === localize(DEFAULT_COURSE_TITLE, language), [language, localize, title])

  const description = useMemo(() => {
    const translation = translate(course.description)
    if (!translation) return

    const courseDescription = `${translation.split('.')[0]}.`

    return translation.length > courseDescription.length ? (
      <>
        {courseDescription}
        <Tooltip>
          <TooltipTrigger className="ml-1 inline-block cursor-help text-[10px] text-muted-foreground/80">
            {'(more)'}
          </TooltipTrigger>
          <TooltipContent arrow={false} className="max-w-[300px] text-sm" side="top" sideOffset={4}>
            {translation}
          </TooltipContent>
        </Tooltip>
      </>
    ) : (
      courseDescription
    )
  }, [course.description, translate])

  const lessonsMessage = useMemo(
    () =>
      course.lessons.length > 0
        ? `${course.lessons.length} ${t('lessons', { count: course.lessons.length })}`
        : t('noLessonsCreated'),
    [course.lessons.length, t]
  )

  const createdOn = useMemo(
    () =>
      t('createdOnBy', {
        date: f.relativeTime(new Date(course.createdAt), Date.now()),
      }),
    [course.createdAt, f, t]
  )

  const completedLessons = useMemo(
    () => course.lessons?.filter(lesson => lesson.completed).length ?? 0,
    [course.lessons]
  )

  const action = useMemo(() => {
    if (user.canEdit) return t('editCourse')
    if (!course.enrolled) return t('startCourse')
    if (course.completed) return t('reviewCourse')
    return t('continueCourse')
  }, [course.enrolled, course.completed, t, user.canEdit])

  const archiveCourse = useCallback(async () => {
    try {
      await updateCourse({ id: course.id, archived_at: new Date().toISOString() })
      toast.success(t('courseArchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, t, updateCourse])

  const unarchiveCourse = useCallback(async () => {
    try {
      await updateCourse({ id: course.id, archived_at: null })
      toast.success(t('courseUnarchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, t, updateCourse])

  const deleteCourse = useCallback(async () => {
    try {
      await deleteSessionCourse(course.id)
      toast.success(t('courseDeleted'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseDeletedError'))
    }
  }, [course.id, t, deleteSessionCourse])

  useEffect(() => {
    if (activeLanguages.includes(language)) return
    updateLanguage(course.languages.includes(locale) ? locale : activeLanguages[0])
  }, [activeLanguages, course.languages.includes, language, locale, updateLanguage, course.languages])

  return (
    <Card className="min-h-80">
      <CardHeader className="gap-4">
        <div className="flex gap-2.5">
          {course.icon ? (
            <DynamicIcon
              className="size-4 shrink-0 stroke-muted-foreground/80"
              name={course.icon as IconName}
              placeholder={Skeleton}
              placeholderProps={{ className: 'size-4 shrink-0' }}
            />
          ) : (
            <Skeleton className="size-4 shrink-0 animate-none" />
          )}
          <div className="flex grow flex-col gap-2">
            <div className="-mt-0.5 flex">
              <Link
                className={cn(
                  'font-semibold text-base leading-[normal] transition-none',
                  (isDefaultTitle || !title) && 'text-muted-foreground/50'
                )}
                href={coursePath}
                title={t('viewCourse')}
              >
                {title ?? t('noTitle')}
              </Link>
              {user.isLearner && course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
            </div>
            {user.canEdit && (
              <div className="flex items-center gap-1">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <LinkIcon className="size-2.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent arrow={false} side="top" sideOffset={2} size="xs">
                    {t('courseSlug')}
                  </TooltipContent>
                </Tooltip>
                <Link className="font-mono text-[11px] text-muted-foreground" href={coursePath} title={t('viewCourse')}>
                  {course.slug}
                </Link>
              </div>
            )}
            {course.skillGroup && (
              <Badge className="text-[11px]" size="xs">
                {translate(course.skillGroup.name as IntlRecord)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mb-0.5">
        <p className={cn('text-sm', description ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
          {description ?? t('noDescription')}
        </p>
      </CardContent>
      <CardFooter className="flex grow flex-col justify-end gap-4">
        <div className="flex flex-col gap-2">
          {/* Drafts */}
          {user.canEdit && (
            <div className="flex items-center gap-2.5 font-normal text-muted-foreground text-xs">
              <LanguagesIcon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                {languageItems.map(item => (
                  <CourseCardLanguage key={item.value} showState={showState} {...item} />
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
                <span>{createdOn}</span>
                <HoverCard closeDelay={50} openDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button
                      className={
                        'peer/user-card cursor-default gap-1 pr-0.5 font-normal text-muted-foreground text-xs data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground dark:data-[state=open]:bg-accent/50'
                      }
                      size="text"
                      variant="ghost"
                    >
                      <Avatar className="size-3.5 rounded-full">
                        {course.creator.avatarUrl && (
                          <AvatarImage className="rounded-full" src={course.creator.avatarUrl} />
                        )}
                        <AvatarFallback className="text-[7px]">{user.initials}</AvatarFallback>
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
              <div className="-space-x-0.5 flex hover:space-x-1">
                {course.contributors.map(user => (
                  <HoverCard closeDelay={50} key={user.id} openDelay={300}>
                    <HoverCardTrigger asChild>
                      <Avatar className="size-3.5 rounded-full ring-2 ring-background transition-all duration-200 ease-in-out">
                        {user.avatarUrl && <AvatarImage className="rounded-full" src={user.avatarUrl} />}
                        <AvatarFallback className="text-[7px]">{user.initials}</AvatarFallback>
                      </Avatar>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-popover" side="top">
                      <UserCard user={user} />
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
                {course.completion}
                {'% '}
                {t('completed').toLowerCase()}
              </span>
            </div>
            <Progress className="h-1.5" value={course.completion} />
          </div>
        )}
        {user.canEdit ? (
          <ButtonGroup className="w-full">
            <Button asChild className="flex-1" variant="outline">
              <Link href={coursePath}>{action}</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  {course.archivedAt ? (
                    <AlertDialog>
                      <AlertDialogTrigger className="w-full">
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <ArchiveIcon />
                          {tCommon('unarchive')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmUnarchiveTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('confirmUnarchiveMessage')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={unarchiveCourse} variant="brand">
                            {tCommon('continue')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger className="w-full">
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <ArchiveIcon />
                          {tCommon('archive')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmArchiveTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('confirmArchiveMessage')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={archiveCourse} variant="warning">
                            {tCommon('continue')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <RocketIcon className="size-4 text-muted-foreground" />
                      {t('publishIn')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {localeItems.map(item => (
                        <DropdownMenuItem key={item.value}>{`${item.displayLabel} ${item.icon}`}</DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <AlertDialog>
                    <AlertDialogTrigger className="w-full">
                      <DropdownMenuItem onSelect={e => e.preventDefault()} variant="destructive">
                        <Trash2Icon />
                        {tCommon('delete')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('confirmDeleteMessage')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteCourse} variant="destructive">
                          {tCommon('continue')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        ) : (
          <Button asChild className="w-full" variant="outline">
            <Link href={coursePath}>{action}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
