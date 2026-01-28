'use client'

import { memo, useCallback, useMemo, useState } from 'react'

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
import { type Locale, useFormatter } from 'next-intl'

import { UserCard } from '@/components/features/users/user-card'
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
import { type Course } from '@/db/queries/course'
import { i18n, type LocaleItem, localizeRecord, type Translator } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const CourseCard = memo(
  ({
    className,
    course,
    editable,
    languages,
    locale,
    localeItems,
    translator: t,
    onArchive,
    onDelete,
    onIconChange,
    onLanguageChange,
    onUnarchive,
    ...props
  }: React.ComponentProps<typeof Card> & {
    course: Course & { language: Locale }
    editable: boolean
    languages: Locale[]
    locale: Locale
    localeItems: LocaleItem[]
    translator: Translator<'Courses'>
    onArchive: () => Promise<void>
    onDelete: () => Promise<void>
    onIconChange: (icon: IconName) => void
    onLanguageChange: (value: Locale) => void
    onUnarchive: () => Promise<void>
  }) => {
    const f = useFormatter()

    const [languageState, setLanguageState] = useState<Locale | null>(null)

    const language = useMemo(() => {
      if (languageState) return languageState
      if (course.languages?.includes(locale) && languages.includes(locale)) return locale
      if (languages.includes(course.language)) return course.language
      return languages[0]
    }, [course.language, course.languages, languages, languageState, locale])

    const setLanguage = useCallback(
      (value: Locale) => {
        if (value === language) return
        setLanguageState(value)
        onLanguageChange(value)
      },
      [language, onLanguageChange]
    )

    const title = useMemo(() => localizeRecord(course.title, language), [course.title, language])
    const coursePath = `/courses/${course.slug}?lang=${language}` as const
    const completedLessons = useMemo(
      () => course.lessons?.filter(lesson => lesson.completed).length ?? 0,
      [course.lessons]
    )
    const lessonsMessage =
      course.lessons.length > 0
        ? `${course.lessons.length} ${t('lessons', {
            count: course.lessons.length,
          })}`
        : t('noLessonsCreated')
    const createdOn = t('createdOnBy', {
      date: f.relativeTime(new Date(course.created_at), Date.now()),
    })

    const languageItems = useMemo(
      () =>
        localeItems
          .filter(({ value }) => languages.includes(value))
          .map(item => ({
            ...item,
            active: item.value === language,
            published: !!course.languages && course.languages.includes(item.value),
          }))
          .sort((a, b) => i18n.locales.indexOf(a.value) - i18n.locales.indexOf(b.value)),
      [course.languages, language, languages, localeItems]
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
    }, [course.description, language, t])

    const action = useMemo(() => {
      if (editable) return t('editCourse')
      if (!course.enrolled) return t('startCourse')
      if (course.completed) return t('reviewCourse')
      return t('continueCourse')
    }, [course.completed, course.enrolled, editable, t])

    return (
      <Card className={cn('min-h-80', className)} {...props}>
        <CardHeader className="gap-4">
          <IconPicker
            categorized={false}
            className="size-8 shrink-0 rounded-full bg-muted/50 stroke-muted-foreground/80 hover:bg-muted! hover:text-accent-foreground data-[state=open]:bg-muted!"
            onValueChange={onIconChange}
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
                  prefetch
                  title={t('viewCourse')}
                >
                  {title ?? t('noTitle')}
                </Link>
                {!editable && course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
              </div>
              {editable && (
                <div className="flex items-center gap-1">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <LinkIcon className="size-2.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={2} size="xs">
                      {t('courseSlug')}
                    </TooltipContent>
                  </Tooltip>
                  <Link
                    className="font-mono text-[11px] text-muted-foreground"
                    href={coursePath}
                    title={t('viewCourse')}
                  >
                    {course.slug}
                  </Link>
                </div>
              )}
            </div>
            {course.skill_group && <Badge>{localizeRecord(course.skill_group.name, language)}</Badge>}
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
            {editable && (
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
                            <span className={cn(!active && 'opacity-50')}>{icon}</span>
                            {published && <div className="absolute bottom-0 size-1 rounded-full bg-success" />}
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
            {editable && (
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
                          <AvatarFallback className="text-[7px]">{course.creator.initials}</AvatarFallback>
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
                        <Avatar className="size-3.5 rounded-full border ring-background transition-all duration-200 ease-in-out">
                          {contributor.avatar_url && (
                            <AvatarImage className="rounded-full" src={contributor.avatar_url} />
                          )}
                          <AvatarFallback className="text-[7px]">{contributor.initials}</AvatarFallback>
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
          {!editable && course.enrolled && (
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
          {editable ? (
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
                            {t('unarchive')}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmUnarchiveTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('confirmUnarchiveMessage')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={onUnarchive} variant="brand">
                              {t('continue')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger className="w-full">
                          <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <ArchiveIcon />
                            {t('archive')}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmArchiveTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('confirmArchiveMessage')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={onArchive} variant="warning">
                              {t('continue')}
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
                          {t('delete')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('confirmDeleteMessage')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete} variant="destructive">
                            {t('continue')}
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
)
