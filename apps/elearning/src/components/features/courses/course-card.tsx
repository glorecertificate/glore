'use client'

import { useMemo } from 'react'

import { BookOpenIcon, LanguagesIcon, UserPenIcon } from 'lucide-react'

import { type Course } from '@/api/modules/courses/types'
import { UserCard } from '@/components/features/user-card'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from '@/components/ui/tooltip'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { LOCALE_ITEMS } from '@/lib/i18n/config'
import { type Locale, type LocaleItem } from '@/lib/i18n/types'
import { dynamicRoute, Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

const CourseCardFlag = ({
  active,
  icon,
  showTooltip,
  value,
}: LocaleItem & {
  active: boolean
  showTooltip?: boolean
}) => {
  const { locale } = useLocale()
  const t = useTranslations()

  const language = useMemo(() => t(`Languages.${value}`), [t, value])
  const trigger = useMemo(
    () => <span className={cn('cursor-default leading-none text-shadow-2xs', !active && 'opacity-40')}>{icon}</span>,
    [icon, active],
  )
  const content = useMemo(() => {
    const displayLanguage = locale === 'en' ? language : language.toLowerCase()
    return `${active ? t('Courses.localePublished') : t('Courses.localeNotPublished')} ${displayLanguage}`
  }, [active, language, locale, t])
  const tooltipVariant = useMemo<TooltipContentProps['variant']>(() => (active ? 'success' : 'default'), [active])

  if (!showTooltip) return trigger

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent arrow={false} variant={tooltipVariant}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export const CourseCard = ({
  activeLocales,
  course,
  showTooltips = true,
}: {
  activeLocales: Locale[]
  course: Course
  showTooltips?: boolean
}) => {
  const { localize } = useLocale()
  const { user } = useSession()
  const t = useTranslations()

  const coursePath = useMemo(() => dynamicRoute(Route.Course, { slug: course.slug }), [course.slug])
  const lessonsCount = useMemo(() => course.lessons?.length || 0, [course.lessons])
  const publishedLocales = useMemo(() => course.publishedLocales ?? [], [course.publishedLocales])
  const draftLocales = useMemo(() => course.draftLocales ?? [], [course.draftLocales])

  const languages = useMemo(
    () =>
      activeLocales.reduce(
        (items, locale) => {
          const item = LOCALE_ITEMS.find(({ value }) => value === locale)!
          if (publishedLocales.includes(locale)) return [...items, { ...item, active: true }]
          if (draftLocales.includes(locale)) return [...items, { ...item, active: false }]
          return items
        },
        [] as Array<LocaleItem & { active: boolean }>,
      ),
    [activeLocales, publishedLocales, draftLocales],
  )

  const creator = useMemo(() => {
    if (!course.creator) return null
    const nameParts = []
    if (course.creator.firstName) nameParts.push(course.creator.firstName)
    if (course.creator.lastName) nameParts.push(`${course.creator.lastName[0]}.`)
    if (nameParts.length === 0) nameParts.push(course.creator.username ?? course.creator.email)
    const name = nameParts
      .filter(Boolean)
      .map(part => part.trim())
      .join(' ')
    return { ...course.creator, name }
  }, [course.creator])

  const actionLabel = useMemo(() => {
    if (user.canEdit) return t('Courses.editCourse')
    if (!course.enrolled) return t('Courses.startCourse')
    if (course.completed) return t('Courses.reviewCourse')
    return t('Courses.continueCourse')
  }, [course.enrolled, course.completed, t, user.canEdit])

  return (
    <Card className="group flex h-full flex-col justify-between gap-0 overflow-hidden pt-0">
      <div>
        <div className="relative h-40 w-full overflow-hidden">
          <Link href={coursePath}>
            {course.imageUrl && (
              <Image
                alt={localize(course.title)}
                className="object-cover transition-all duration-200 group-hover:scale-110 group-has-[[data-state=open]]:scale-110"
                fill
                src={course.imageUrl}
              />
            )}
          </Link>
        </div>
        <div className="flex flex-col gap-3 py-4">
          <CardHeader>
            <h3 className="flex items-center font-semibold">
              <Link className="text-lg" href={coursePath}>
                {localize(course.title)}
              </Link>
              {user.isLearner && course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
              {user.canEdit && publishedLocales.length === 0 && (
                <Badge className="ml-1.5" size="xs">
                  {t('Courses.draft')}
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{localize(course.description)}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <LanguagesIcon className="size-3.5" />
              <div className="flex items-center gap-1.5">
                {languages.map(item => (
                  <CourseCardFlag key={item.value} showTooltip={showTooltips} {...item} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
              <BookOpenIcon className="size-3.5 text-foreground" />
              {lessonsCount > 0 ? (
                <>
                  {course.lessons?.length} {t('Common.lessons', { count: course.lessons?.length || 0 })}
                </>
              ) : (
                t('Courses.noLessons')
              )}
            </div>
            {creator && (
              <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
                <UserPenIcon className="size-3.5 text-foreground" />
                <div className="flex items-center gap-2">
                  <span>{t('Courses.createdBy')}</span>
                  <HoverCard closeDelay={50} openDelay={300}>
                    <HoverCardTrigger asChild>
                      <Button
                        className={`
                          peer/user-card cursor-default gap-1 pr-0.5 text-xs font-normal text-muted-foreground
                          data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground
                          dark:data-[state=open]:bg-accent/50
                        `}
                        size="text"
                        variant="ghost"
                      >
                        {creator.avatarUrl && (
                          <Avatar className={cn('size-3.5 rounded-full')}>
                            <AvatarImage className="rounded-full" src={creator.avatarUrl} />
                          </Avatar>
                        )}
                        {creator.name}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-popover" side="top">
                      <UserCard user={creator} />
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
      <CardFooter className="flex-col gap-4">
        {!user.canEdit && course.enrolled && (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                {course.lessonsCompleted}
                {' / '}
                {course.lessonsCount}{' '}
                {t('Common.lessons', {
                  count: course.lessonsCount,
                })}
              </span>
              <span>
                {course.progress}
                {'% '}
                {t('Common.completed').toLowerCase()}
              </span>
            </div>
            <Progress className="h-1.5" value={course.progress} />
          </div>
        )}
        <Link className="w-full" href={coursePath}>
          <Button className="w-full dark:hover:bg-background/50" variant="outline">
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
