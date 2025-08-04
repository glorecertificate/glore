'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, PlusIcon, XIcon } from 'lucide-react'
import { type Locale } from 'use-intl'

import { hasHistory } from '@repo/utils'

import { api } from '@/api/client'
import { type Course } from '@/api/modules/courses/types'
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
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { LOCALE_ITEMS, LOCALES } from '@/lib/i18n/config'
import { Route } from '@/lib/navigation'
import { cookies } from '@/lib/storage/client'
import { cn } from '@/lib/utils'

const EDITOR_TABS = ['all', 'active', 'partial', 'draft', 'archived'] as const
const EDITOR_SORTS = ['name', 'type'] as const
const LEARNER_TABS = ['all', 'not_started', 'in_progress', 'completed'] as const
const LEARNER_SORTS = ['name', 'progress', 'type'] as const

export type CourseTab = (typeof EDITOR_TABS)[number] | (typeof LEARNER_TABS)[number]
type CourseSort = (typeof EDITOR_SORTS)[number] | (typeof LEARNER_SORTS)[number]
type SortOptions = Record<CourseSort, string>
type SortDirection = 'asc' | 'desc'

const CourseTabsTrigger = ({ count, label, value }: { count: number; label: string; value: CourseTab }) => (
  <TabsTrigger className="flex items-center gap-1" count={count} value={value}>
    {label}
  </TabsTrigger>
)

const SortDropdown = ({
  direction,
  setDirection,
  setValue,
  tab,
  value,
}: {
  direction: SortDirection | null
  setDirection: React.Dispatch<React.SetStateAction<SortDirection | null>>
  tab: CourseTab
  value: CourseSort | null
  setValue: React.Dispatch<React.SetStateAction<CourseSort | null>>
}) => {
  const { user } = useSession()
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  const options = useMemo(() => {
    const sorts = user.canEdit ? EDITOR_SORTS : LEARNER_SORTS
    return sorts.reduce((options, sort) => ({ ...options, [sort]: t(`Courses.${sort}`) }), {} as SortOptions)
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
  defaultLocales = LOCALES,
  defaultTab = 'all',
}: {
  defaultLocales?: Locale[]
  defaultTab?: CourseTab
}) => {
  const { localize } = useLocale()
  const { courses: allCourses, setCourses, user } = useSession()
  const t = useTranslations('Courses')

  const [activeTab, setActiveTab] = useState<CourseTab>(defaultTab)
  const [activeSort, setActiveSort] = useState<CourseSort | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)
  const [locales, setLocaleState] = useState<Locale[]>(defaultLocales)

  const getCourseLocales = useCallback(
    (course: Course) => [...(course.publishedLocales || []), ...(course.draftLocales || [])],
    [],
  )

  const pageDescription = useMemo(
    () => (user.isAdmin ? t('descriptionAdmin') : user.isEditor ? t('descriptionEditor') : t('description')),
    [t, user.isAdmin, user.isEditor],
  )

  const hasFilters = useMemo(() => locales.length !== LOCALES.length, [locales.length])

  const courses = useMemo<Record<CourseTab, Course[]>>(() => {
    const notArchived = allCourses.filter(course => !course.archivedAt)
    const archived = allCourses.filter(course => course.archivedAt)

    const all = notArchived.filter(course => locales.some(locale => getCourseLocales(course).includes(locale)))
    const active = all.filter(course => locales.every(locale => course.publishedLocales?.includes(locale)))
    const partial = all.filter(
      course =>
        locales.some(locale => course.publishedLocales?.includes(locale)) &&
        locales.some(locale => course.draftLocales?.includes(locale)),
    )
    const draft = all.filter(course =>
      locales.every(locale => !course.publishedLocales?.includes(locale) || course.draftLocales?.includes(locale)),
    )

    const visible = notArchived.filter(course => locales.some(locale => course.publishedLocales?.includes(locale)))
    const not_started = visible.filter(course => course.status === 'not_started')
    const in_progress = visible.filter(course => course.status === 'in_progress')
    const completed = visible.filter(course => course.status === 'completed')

    return { all, active, partial, draft, archived, not_started, in_progress, completed }
  }, [allCourses, getCourseLocales, locales])

  const tabs = useMemo(
    () =>
      user.canEdit
        ? locales.length > 1 && courses.partial.length > 0
          ? EDITOR_TABS
          : EDITOR_TABS.filter(tab => tab !== 'partial')
        : LEARNER_TABS,
    [courses.partial.length, locales.length, user.canEdit],
  )

  const setLocales = useCallback(
    (selected: Locale[]) => {
      setLocaleState(selected)
      cookies.set('course-locales', selected)
      if (activeTab === 'partial' && (selected.length === 1 || courses.partial.length === 0)) setActiveTab('all')
    },
    [activeTab, courses.partial.length],
  )

  const displayedCourses = useMemo(
    () =>
      courses[activeTab].sort((a, b) => {
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
            return a.sortOrder - b.sortOrder
        }
      }),
    [activeSort, activeTab, courses, localize, sortDirection],
  )

  const showCardTooltips = useMemo(() => activeTab !== 'archived', [activeTab])

  const emptyListTitle = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return t('emptyTitleActive')
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
      case 'active':
        return enhanceEmptyListMessage(t('emptyMessageActive'))
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
  }, [setCourses])

  const handleTabChange = useCallback((value: string) => {
    const tab = value as CourseTab
    setActiveTab(tab)
    cookies.set('course-tab', tab)
  }, [])

  useEffect(() => {
    const localeCookie = cookies.get('course-locales')
    if (!localeCookie || localeCookie.length === 0) {
      setLocaleState(LOCALES)
      cookies.set('course-locales', LOCALES)
    }
    void fetchCourses()
  }, [fetchCourses])

  return (
    <>
      <div className="pb-2">
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>
      <div className="w-full grow py-6">
        <Tabs className="h-full" defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-6 flex h-auto flex-col justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <TabsList className="w-full sm:w-fit">
                {tabs.map(tab => (
                  <CourseTabsTrigger count={courses[tab].length} key={tab} label={t(tab)} value={tab} />
                ))}
              </TabsList>
              {user.canEdit && (
                <Button asChild effect="expandIcon" icon={PlusIcon} iconPlacement="right" variant="brand">
                  <Link href={Route.CourseNew}>{t('newCourse')}</Link>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <MultiSelect
                contentProps={{
                  className: 'w-36',
                }}
                minItems={{
                  count: 1,
                  message: t('selectAtLeastOneLanguage'),
                }}
                onChange={setLocales as (selected: string[]) => void}
                options={LOCALE_ITEMS}
                placeholder={t('selectLanguages')}
                search={false}
                value={locales}
              />
              <SortDropdown
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {displayedCourses.map(course => (
                  <CourseCard activeLocales={locales} course={course} key={course.id} showTooltips={showCardTooltips} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
