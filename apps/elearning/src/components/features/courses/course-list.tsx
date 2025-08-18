'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArchiveIcon, ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, PlusIcon, XIcon } from 'lucide-react'
import { type Locale } from 'use-intl'

import { hasHistory } from '@repo/utils/has-history'
import { toCamelCase } from '@repo/utils/to-camel-case'
import { type SnakeToCamel } from '@repo/utils/types'

import { CourseCard } from '@/components/features/courses/course-card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NoResultsGraphic } from '@/components/ui/graphics/no-results'
import { Link } from '@/components/ui/link'
import { MultiSelect } from '@/components/ui/multi-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useApi } from '@/hooks/use-api'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { type Course } from '@/lib/api/courses/types'
import { Route } from '@/lib/navigation'
import { cookies } from '@/lib/storage'
import { cn } from '@/lib/utils'

const TABS = Object.freeze({
  editor: ['all', 'published', 'partial', 'draft', 'archived'] as const,
  learner: ['all', 'not_started', 'in_progress', 'completed'] as const,
})

const SORTS = Object.freeze({
  editor: ['name', 'type'] as const,
  learner: ['name', 'progress', 'type'] as const,
})

export type CourseTab = (typeof TABS.editor)[number] | (typeof TABS.learner)[number]
export type CourseSort = (typeof SORTS.editor)[number] | (typeof SORTS.learner)[number]
export type CourseSortOptions = Record<CourseSort, string>
export type CourseSortDirection = 'asc' | 'desc'

const CourseTabsTrigger = ({ value, ...props }: { count: number; value: CourseTab }) => {
  const t = useTranslations('Courses')

  return value === 'archived' ? (
    <TabsTrigger className="flex items-center p-0" value={value} {...props}>
      <Tooltip delayDuration={0} disableHoverableContent>
        <TooltipTrigger asChild>
          <span className="inline-block px-3.5">
            <ArchiveIcon />
          </span>
        </TooltipTrigger>
        <TooltipContent arrow={false} sideOffset={10}>
          {t('archive')}
        </TooltipContent>
      </Tooltip>
    </TabsTrigger>
  ) : (
    <TabsTrigger className="flex items-center gap-1" value={value} {...props}>
      {t(value)}
    </TabsTrigger>
  )
}

const CourseSortDropdown = ({
  direction,
  setDirection,
  setValue,
  tab,
  value,
}: {
  direction: CourseSortDirection | null
  setDirection: React.Dispatch<React.SetStateAction<CourseSortDirection | null>>
  tab: CourseTab
  value: CourseSort | null
  setValue: React.Dispatch<React.SetStateAction<CourseSort | null>>
}) => {
  const { user } = useSession()
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  const options = useMemo(() => {
    const sorts = user.canEdit ? SORTS.editor : SORTS.learner
    return sorts.reduce((options, sort) => ({ ...options, [sort]: t(`Courses.${sort}`) }), {} as CourseSortOptions)
  }, [t, user.canEdit])

  const icon = useMemo(() => {
    if (!value) return <ChevronsUpDown className="size-3.5" />
    const Icon = direction === 'asc' ? ArrowUpIcon : ArrowDownIcon
    return <Icon className="size-3 text-muted-foreground" />
  }, [direction, value])

  const inverseDirection = useMemo(() => (direction === 'asc' ? 'desc' : 'asc'), [direction])

  const handleSortChange = useCallback(
    (sort: CourseSort) => () => {
      if (sort === value) setDirection(inverseDirection)
      if (!value || value !== sort) setValue(sort)
      setOpen(true)
    },
    [inverseDirection, setDirection, setValue, value],
  )

  const handleSortItemSelect = useCallback((e: Event) => {
    e.preventDefault()
  }, [])

  const clearSort = useCallback(() => {
    setValue(null)
    setDirection(null)
  }, [setDirection, setValue])

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button className="group h-9 gap-0 has-[>svg]:px-3" size="sm" variant="outline">
          <span className="mr-1.5">{t('Common.sortBy')}</span>
          {value && <span className="mr-0.5 text-xs font-medium text-muted-foreground">{options[value]}</span>}
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t('Courses.sortBy')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(options).map(([key, label]) => {
          const option = key as keyof typeof options
          return (
            (option !== 'progress' || (tab !== 'not_started' && tab !== 'completed')) && (
              <DropdownMenuItem
                className={cn(
                  'group/dropdown-menu-item flex h-9 cursor-pointer items-center justify-between',
                  value === option && 'cursor-default bg-accent dark:bg-background/40',
                )}
                key={key}
                onClick={handleSortChange(option)}
                onSelect={handleSortItemSelect}
              >
                <span className={cn('text-foreground/90', value === option && 'text-foreground')}>{label}</span>
                {value === option && (
                  <Button
                    className="size-6 bg-card transition-all duration-75 hover:bg-card hover:shadow-none active:bg-card/50"
                    size="icon"
                  >
                    {direction === 'asc' ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
                  </Button>
                )}
              </DropdownMenuItem>
            )
          )
        })}
        {value && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearSort}>
              <XIcon className="mr-1 h-4 w-4" />
              {t('Common.clearSort')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const CourseList = ({
  defaultCoursesLanguage,
  defaultLanguageFilter,
  defaultTab = 'all',
}: {
  defaultCoursesLanguage?: Record<string, Locale>
  defaultLanguageFilter?: Locale[]
  defaultTab?: CourseTab
}) => {
  const api = useApi()
  const { locale, localeItems, locales, localize } = useLocale()
  const { courses: allCourses, setCourses, user } = useSession()
  const t = useTranslations('Courses')

  const [activeTab, setActiveTab] = useState<CourseTab>(defaultTab)
  const [activeSort, setActiveSort] = useState<CourseSort | null>(null)
  const [languageFilter, setLanguageFilter] = useState<Locale[]>(defaultLanguageFilter ?? locales)
  const [sortDirection, setSortDirection] = useState<CourseSortDirection | null>(null)

  const pageDescription = useMemo(
    () => (user.isAdmin ? t('descriptionAdmin') : user.isEditor ? t('descriptionEditor') : t('description')),
    [t, user.isAdmin, user.isEditor],
  )

  const activeLanguages = useMemo(
    () => languageFilter.sort((a, b) => locales.indexOf(a) - locales.indexOf(b)),
    [languageFilter, locales],
  )

  const hasFilters = useMemo(() => activeLanguages.length !== locales.length, [activeLanguages.length, locales.length])

  const sortLanguages = useCallback(
    (langs: Locale[] | null) => langs?.sort((a, b) => locales.indexOf(a) - locales.indexOf(b)) ?? [],
    [locales],
  )

  const getAvailableLanguages = useCallback(
    (course: Course) => {
      const published = sortLanguages(course.publishedLocales)
      const draft = sortLanguages(course.draftLocales)

      return { all: sortLanguages([...published, ...draft]), published, draft }
    },
    [sortLanguages],
  )

  const courses = useMemo<Record<SnakeToCamel<CourseTab>, Course[]>>(() => {
    const notArchived = allCourses.filter(course => !course.archivedAt)
    const archived = allCourses.filter(course => course.archivedAt)

    const all = notArchived.filter(course =>
      activeLanguages.some(locale => getAvailableLanguages(course).all.includes(locale)),
    )
    const published = all.filter(course => activeLanguages.every(locale => course.publishedLocales?.includes(locale)))
    const partial = all.filter(
      course =>
        activeLanguages.some(locale => course.publishedLocales?.includes(locale)) &&
        activeLanguages.some(locale => course.draftLocales?.includes(locale)),
    )
    const draft = all.filter(course =>
      activeLanguages.every(
        locale => !course.publishedLocales?.includes(locale) || course.draftLocales?.includes(locale),
      ),
    )

    const visible = notArchived.filter(course =>
      activeLanguages.some(locale => course.publishedLocales?.includes(locale)),
    )
    const notStarted = visible.filter(course => course.userStatus === 'not_started')
    const inProgress = visible.filter(course => course.userStatus === 'in_progress')
    const completed = visible.filter(course => course.userStatus === 'completed')

    return { all, published, partial, draft, archived, notStarted, inProgress, completed }
  }, [allCourses, activeLanguages, getAvailableLanguages])

  const tabs = useMemo(
    () =>
      user.canEdit
        ? activeLanguages.length > 1 && courses.partial.length > 0
          ? TABS.editor
          : TABS.editor.filter(tab => tab !== 'partial')
        : TABS.learner,
    [courses.partial.length, activeLanguages.length, user.canEdit],
  )

  const displayedCourses = useMemo(
    () =>
      courses[toCamelCase(activeTab)]
        .map(course => {
          const cookieLanguage = defaultCoursesLanguage?.[String(course.id)]
          if (cookieLanguage && activeLanguages.includes(cookieLanguage)) return { ...course, language: cookieLanguage }
          const langs = getAvailableLanguages(course)
          const lang = langs.all.includes(locale) ? locale : langs.published[0] || langs.draft[0]
          return { ...course, language: lang }
        })
        .sort((a, b) => {
          switch (activeSort) {
            case 'name': {
              const titleA = localize(a.title)
              const titleB = localize(b.title)
              if (!titleA || !titleB) return 0
              return sortDirection === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
            }
            case 'progress':
              return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
            case 'type':
              return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
            default:
              return a.createdAt < b.createdAt ? 1 : 0
          }
        }),
    [
      activeLanguages,
      activeSort,
      activeTab,
      courses,
      defaultCoursesLanguage,
      getAvailableLanguages,
      locale,
      localize,
      sortDirection,
    ],
  )

  const showCardTooltips = useMemo(() => activeTab !== 'archived', [activeTab])

  const emptyListTitle = useMemo(() => {
    switch (activeTab) {
      case 'published':
        return t('emptyTitlePublished')
      case 'draft':
        return t('emptyTitleDraft')
      case 'archived':
        return t('emptyTitleArchived')
      default:
        return hasFilters ? t('emptyTitleCommon') : t('emptyTitle')
    }
  }, [activeTab, hasFilters, t])

  const enhanceEmptyListMessage = useCallback(
    (message: string) => (hasFilters ? t.markup('withFilters', { message }) : t('atTheMoment', { message })),
    [hasFilters, t],
  )

  const emptyListMessage = useMemo(() => {
    switch (activeTab) {
      case 'published':
        return enhanceEmptyListMessage(t('emptyMessagePublished'))
      case 'draft':
        return enhanceEmptyListMessage(t('emptyMessageDraft'))
      case 'archived':
        return enhanceEmptyListMessage(t('emptyMessageArchived'))
      case 'not_started':
        return t('emptyMessageNotStarted')
      case 'in_progress':
        return t('emptyMessageInProgress')
      case 'completed':
        return t('emptyMessageCompleted')
      default:
        return t('emptyMessage')
    }
  }, [activeTab, enhanceEmptyListMessage, t])

  const fetchCourses = useCallback(async () => {
    if (!hasHistory()) return
    const courses = await api.courses.list()
    setCourses(courses)
  }, [api.courses, setCourses])

  const handleTabChange = useCallback((value: string) => {
    const tab = value as CourseTab
    setActiveTab(tab)
    cookies.set('course-tab', tab)
  }, [])

  const setActiveLanguages = useCallback(
    (selected: Locale[]) => {
      setLanguageFilter(selected)
      cookies.set('courses-language-filter', selected)
      if (activeTab === 'partial' && (selected.length === 1 || courses.partial.length === 0)) setActiveTab('all')
    },
    [activeTab, courses.partial.length],
  )

  useEffect(() => {
    const languageCookie = cookies.get('courses-language-filter')
    if (!languageCookie || languageCookie.length === 0) setActiveLanguages(locales)
    void fetchCourses()
  }, [fetchCourses, locales, setActiveLanguages])

  return (
    <>
      <div className="pb-2">
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>
      <div className="w-full grow py-6">
        <Tabs className="h-full" defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-4 block justify-between gap-4 xl:flex">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 xl:mb-0 xl:justify-start">
              <TabsList className="w-full sm:w-fit">
                {tabs.map(tab => (
                  <CourseTabsTrigger count={courses[toCamelCase(tab)].length} key={tab} value={tab} />
                ))}
              </TabsList>
              {user.canEdit && (
                <Button
                  asChild
                  className="max-sm:w-full"
                  effect="expandIcon"
                  icon={PlusIcon}
                  iconPlacement="right"
                  variant="brand"
                >
                  <Link href={Route.CourseNew}>{t('newCourse')}</Link>
                </Button>
              )}
            </div>
            <div className="flex justify-between gap-2 xl:justify-end">
              <MultiSelect
                className="w-auto"
                contentProps={{
                  className: 'w-36',
                }}
                minItems={{
                  count: 1,
                  message: t('selectAtLeastOneLanguage'),
                }}
                onChange={setActiveLanguages as (selected: string[]) => void}
                options={localeItems}
                placeholder={t('selectLanguages')}
                search={false}
                toastType="warning"
                value={activeLanguages}
              />
              <CourseSortDropdown
                direction={sortDirection}
                setDirection={setSortDirection}
                setValue={setActiveSort}
                tab={activeTab}
                value={activeSort}
              />
            </div>
          </div>
          <TabsContent className="grow space-y-4 pb-2" value={activeTab}>
            {displayedCourses.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center pt-10 text-center">
                <NoResultsGraphic className="mb-8 w-64" />
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-lg font-medium">{emptyListTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {`${emptyListMessage}.`}
                    {hasFilters && (
                      <>
                        <br />
                        {`${t('updateFilters')}.`}
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {displayedCourses.map(course => (
                  <CourseCard
                    activeLanguages={activeLanguages}
                    course={course}
                    key={course.id}
                    showTooltips={showCardTooltips}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
