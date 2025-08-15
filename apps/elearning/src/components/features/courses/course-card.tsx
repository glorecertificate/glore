'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { BookCheckIcon, BookOpenIcon, DraftingCompassIcon, UserPenIcon } from 'lucide-react'
import { type IconName } from 'lucide-react/dynamic'

import { truncate, TRUNCATE_SYMBOL } from '@repo/utils/truncate'

import { UserCard } from '@/components/features/users/user-card'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { DynamicIcon } from '@/components/ui/icons/dynamic'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { type Course } from '@/lib/api/courses/types'
import { type IntlRecord, type Locale, type LocaleItem } from '@/lib/i18n/types'
import { route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface LanguageItemProps extends LocaleItem {
  active: boolean
  onClick: (value: Locale) => void
  showTooltip: boolean
}

const CourseCardFlag = ({ active, icon, onClick, showTooltip, value }: LanguageItemProps) => {
  const { locale, titleCaseLocales } = useLocale()
  const t = useTranslations('Courses')
  const tLanguages = useTranslations('Languages')

  const language = useMemo(() => tLanguages(value), [tLanguages, value])

  const onFlagClick = useCallback(() => {
    if (active) return
    onClick(value)
  }, [active, onClick, value])

  const trigger = useMemo(
    () => (
      <Button
        className={cn('text-base leading-[1]', active ? 'pointer-events-none cursor-default' : 'opacity-50')}
        onClick={onFlagClick}
        size="text"
        variant="transparent"
      >
        {icon}
      </Button>
    ),
    [active, icon, onFlagClick],
  )

  const content = useMemo(() => {
    const displayLanguage = titleCaseLocales.includes(locale) ? language : language.toLowerCase()
    return `${t('seeIn')} ${displayLanguage}`
  }, [language, locale, t, titleCaseLocales])

  if (active || !showTooltip) return trigger

  return (
    <Tooltip delayDuration={500} disableHoverableContent>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent arrow={false} size="sm">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

const CourseCardDraft = ({ active, icon, onClick, value }: LanguageItemProps) => {
  const { isTitleCase } = useLocale()
  const t = useTranslations('Courses')
  const tLang = useTranslations('Languages')

  const content = useMemo(() => {
    const lang = isTitleCase(value) ? tLang(value) : tLang(value).toLowerCase()
    return `${t('seeIn')} ${lang}`
  }, [isTitleCase, tLang, t, value])

  const onDraftClick = useCallback(() => {
    if (active) return
    onClick(value)
  }, [active, onClick, value])

  return (
    <Tooltip delayDuration={500} disableHoverableContent>
      <TooltipTrigger asChild>
        <Button
          className={cn('text-sm leading-[1]', active ? 'pointer-events-none' : 'opacity-50')}
          onClick={onDraftClick}
          size="text"
          variant="transparent"
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent arrow={false} sideOffset={4} size="sm">
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
  const { locale, localeItems, locales, localize } = useLocale()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const getLang = useCallback(
    () =>
      course.publishedLocales?.includes(locale)
        ? course.publishedLocales.sort((a, b) => locales.indexOf(a) - locales.indexOf(b))[0]
        : locale,
    [course.publishedLocales, locale, locales],
  )

  const [language, setLanguage] = useState(getLang())

  const translate = useCallback((record: IntlRecord) => localize(record, language), [localize, language])

  const onLanguageClick = useCallback(
    (value: Locale) => {
      if (value === language) return
      setLanguage(value)
    },
    [language],
  )

  const coursePath = useMemo(
    () => route('/courses/:slug', { slug: course.slug }, { lang: language }),
    [course.slug, language],
  )

  const languageItems = useMemo(
    () =>
      localeItems
        .reduce(
          (items, item) => [
            ...items,
            {
              ...item,
              active: item.value === language,
              onClick: onLanguageClick,
              showTooltip: showTooltips,
            },
          ],
          [] as LanguageItemProps[],
        )
        .sort((a, b) => locales.indexOf(a.value) - locales.indexOf(b.value)),
    [language, localeItems, locales, onLanguageClick, showTooltips],
  )

  const languages = useMemo(
    () => languageItems.filter(({ value }) => activeLocales.includes(value)),
    [activeLocales, languageItems],
  )

  const publishedLanguages = useMemo(
    () => languages.filter(({ value }) => course.publishedLocales?.includes(value)),
    [course.publishedLocales, languages],
  )

  const draftLang = useMemo(
    () => languages.filter(({ value }) => course.draftLocales?.includes(value)),
    [course.draftLocales, languages],
  )

  const title = useMemo(() => translate(course.title), [course.title, translate])

  const description = useMemo(() => {
    const courseDescription = translate(course.description)
    if (!courseDescription) return undefined
    return courseDescription.length > 150 ? (
      <>
        {truncate(courseDescription, 150, { ellipsis: '' })}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{TRUNCATE_SYMBOL}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] text-sm" side="top" sideOffset={4}>
            {courseDescription}
          </TooltipContent>
        </Tooltip>
      </>
    ) : (
      courseDescription
    )
  }, [course.description, translate])

  const lessons = useMemo(() => {
    const count = course.lessons?.length ?? 0
    if (count === 0) return undefined
    return `${count} ${t('lessons', { count })}`
  }, [course.lessons?.length, t])

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

  const action = useMemo(() => {
    if (user.canEdit) return t('editCourse')
    if (!course.enrolled) return t('startCourse')
    if (course.completed) return t('reviewCourse')
    return t('continueCourse')
  }, [course.enrolled, course.completed, t, user.canEdit])

  useEffect(() => {
    if (activeLocales.includes(language)) return
    return setLanguage(getLang())
  }, [activeLocales, getLang, language])

  return (
    <Card className="min-h-80">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2.5">
            {course.icon && (
              <DynamicIcon
                className="size-4 shrink-0 stroke-muted-foreground"
                name={course.icon as IconName}
                placeholder={Skeleton}
                placeholderProps={{ className: 'size-4 shrink-0' }}
              />
            )}
            <div className="flex grow flex-col gap-0.5">
              <div className="-mt-0.5 flex">
                <Link
                  className={cn(
                    'text-base leading-[normal]',
                    title ? 'font-semibold' : 'font-medium text-muted-foreground/50',
                  )}
                  href={coursePath}
                  title={t('viewCourse')}
                >
                  {'ciao'}
                  {title ?? t('noTitle')}
                </Link>
                {user.isLearner && course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
              </div>
              {course.skill?.group && (
                <span className="text-xs font-medium text-muted-foreground">
                  {translate(course.skill.group.name as IntlRecord)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {publishedLanguages.map(item => (
              <CourseCardFlag key={item.value} {...item} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mb-0.5">
        <p className={cn('text-sm', description ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex grow flex-col justify-end gap-4">
        <div className="flex flex-col gap-2">
          {user.canEdit && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
              <BookCheckIcon className="size-3.5 text-muted-foreground" />
              {draftLang.length > 0 ? (
                <div className="flex items-center gap-1">
                  {t('draftIn')}
                  {draftLang.map(item => (
                    <CourseCardDraft key={item.value} {...item} />
                  ))}
                </div>
              ) : (
                <span className="pointer-events-none text-muted-foreground/50">{t('noDrafts')}</span>
              )}
            </div>
          )}
          {user.canEdit && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
              <DraftingCompassIcon className="size-3.5 text-muted-foreground" />
              {draftLang.length > 0 ? (
                <div className="flex items-center gap-1">
                  {t('draftIn')}
                  {draftLang.map(item => (
                    <CourseCardDraft key={item.value} {...item} />
                  ))}
                </div>
              ) : (
                <span className="pointer-events-none text-muted-foreground/50">{t('noDrafts')}</span>
              )}
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-2.5 text-xs font-normal',
              lessons ? 'text-muted-foreground' : 'pointer-events-none text-muted-foreground/50',
            )}
          >
            <BookOpenIcon className="size-3.5 text-muted-foreground" />
            {lessons ?? t('noLessons')}
          </div>
          {creator && (
            <div className="flex items-center gap-2.5 text-xs font-normal text-muted-foreground">
              <UserPenIcon className="size-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span>{t('createdBy')}</span>
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
        </div>
        {!user.canEdit && course.enrolled && (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                {course.lessonsCompleted}
                {' / '}
                {course.lessonsCount} {t('lessons', { count: course.lessonsCount })}
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
        <Button asChild className="w-full" variant="outline">
          <Link href={coursePath}>{action}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
