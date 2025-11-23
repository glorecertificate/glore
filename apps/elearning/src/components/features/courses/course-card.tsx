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
import { type Locale, useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { UserCard } from '@/components/features/users/user-card'
import { type IconName } from '@/components/icons/dynamic'
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
import { IconPicker } from '@/components/ui/icon-picker'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCookies } from '@/hooks/use-cookies'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { type Course, updateCourse } from '@/lib/data'
import { type LocaleItem } from '@/lib/intl'
import { route } from '@/lib/navigation'
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

  // biome-ignore lint: exhaustive-deps
  const button = useMemo(
    () => (
      <Button
        className={cn('relative text-base', active && 'pointer-events-none cursor-default', className)}
        onClick={handleClick}
        size="text"
        variant="transparent"
        {...props}
      >
        <span className={cn(!active && 'opacity-50')}>{icon}</span>
        {published && <div className="absolute bottom-0 size-1 rounded-full bg-success" />}
      </Button>
    ),
    [active, className, handleClick, icon]
  )

  if (!showState) return button

  return (
    <div className="flex flex-col items-center gap-0">
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent sideOffset={2} size="sm">
          {t(published ? 'previewIn' : 'previewDraftIn', { lang: displayLabel })}
        </TooltipContent>
      </Tooltip>
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
  const cookies = useCookies()
  const { locale, localeItems, locales, localize } = useIntl()
  const { deleteCourse: deleteSessionCourse, setCourse, user } = useSession()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')
  const f = useFormatter()

  const [language, setLanguage] = useState(course.language)

  const updateLanguage = useCallback(
    (value: Locale) => {
      if (value === language) return
      setLanguage(value)
      const languageCookie = cookies.get('course_locale') || {}
      languageCookie[course.slug] = value
      cookies.set('course_locale', languageCookie)
    },
    [cookies, course.slug, language]
  )

  const updateIcon = useCallback(
    async (icon: IconName | null) => {
      await setCourse({ id: course.id, icon })
      await updateCourse(course.id, { icon })
    },
    [course.id, setCourse]
  )

  const coursePath = route('/courses/[slug]', { slug: course.slug }, { lang: language })

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
                    published: !!course.languages && course.languages.includes(item.value),
                    setLanguage: updateLanguage,
                  },
                ]
              : items,
          [] as LanguageItem[]
        )
        .sort((a, b) => locales.indexOf(a.value) - locales.indexOf(b.value)),
    [activeLanguages, course.languages, language, localeItems, locales, updateLanguage]
  )

  const title = localize(course.title, language)

  const description = useMemo(() => {
    const translation = localize(course.description, language)
    if (!translation) return

    const courseDescription = `${translation.split('.')[0]}.`

    return translation.length > courseDescription.length ? (
      <>
        {courseDescription}
        <Tooltip>
          <TooltipTrigger className="ml-1 inline-block cursor-help text-[10px] text-muted-foreground/80">
            {t('cardDescriptionMore')}
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] text-sm" side="top" sideOffset={4}>
            {translation}
          </TooltipContent>
        </Tooltip>
      </>
    ) : (
      courseDescription
    )
  }, [course.description, language, localize, t])

  const lessonsMessage =
    course.lessons.length > 0
      ? `${course.lessons.length} ${t('lessons', { count: course.lessons.length })}`
      : t('noLessonsCreated')

  const createdOn = t('createdOnBy', {
    date: f.relativeTime(new Date(course.created_at), Date.now()),
  })

  const completedLessons = course.lessons?.filter(lesson => lesson.completed).length ?? 0

  const action = useMemo(() => {
    if (user.canEdit) return t('editCourse')
    if (!course.enrolled) return t('startCourse')
    if (course.completed) return t('reviewCourse')
    return t('continueCourse')
  }, [course.enrolled, course.completed, t, user.canEdit])

  const archiveCourse = useCallback(async () => {
    try {
      await updateCourse(course.id, { archived_at: new Date().toISOString() })
      toast.success(t('courseArchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, t])

  const unarchiveCourse = useCallback(async () => {
    try {
      await updateCourse(course.id, { archived_at: null })
      toast.success(t('courseUnarchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, t])

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
    updateLanguage(course.languages?.includes(locale) ? locale : activeLanguages[0])
  }, [activeLanguages, course.languages, language, locale, updateLanguage])

  return (
    <Card className="min-h-80">
      <CardHeader className="gap-4">
        <IconPicker
          className="size-8 shrink-0 rounded-full bg-muted/50 stroke-muted-foreground/80 hover:bg-muted! hover:text-accent-foreground data-[state=open]:bg-muted!"
          onValueChange={updateIcon}
          title={course.icon ? t('updateIcon') : t('addIcon')}
          value={(course.icon as IconName) ?? undefined}
          variant="ghost"
        />
        <div className="flex grow flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex">
              <Link
                className={cn('font-medium leading-[normal] transition-none')}
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
                  <TooltipContent side="top" sideOffset={2} size="xs">
                    {t('courseSlug')}
                  </TooltipContent>
                </Tooltip>
                <Link className="font-mono text-[11px] text-muted-foreground" href={coursePath} title={t('viewCourse')}>
                  {course.slug}
                </Link>
              </div>
            )}
          </div>
          {course.skillGroup && <Badge>{localize(course.skillGroup.name, language)}</Badge>}
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
                      <Avatar className="size-3.5 rounded-full border">
                        {course.creator.avatar_url && (
                          <AvatarImage className="rounded-full" src={course.creator.avatar_url} />
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
                      <Avatar className="size-3.5 rounded-full border ring-background transition-all duration-200 ease-in-out">
                        {user.avatar_url && <AvatarImage className="rounded-full" src={user.avatar_url} />}
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
                  {course.archived_at ? (
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
