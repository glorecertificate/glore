'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'

import { type Course } from '@/api/modules/courses/types'
import { CourseCard } from '@/components/features/courses/course-card'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { type Enums } from 'supabase/types'

const durationSortOrder: Array<Enums<'course_duration'>> = ['short', 'medium', 'long']

export const CoursesList = () => {
  const { courses } = useSession()
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  const sortOptions = useMemo(
    () => ({
      name: t('sortByName'),
      progress: t('sortByProgress'),
      type: t('sortByType'),
      difficulty: t('sortByDifficulty'),
      duration: t('sortByDuration'),
    }),
    [t],
  )

  const [activeTab, setActiveTab] = useState<'all' | Course['status']>('all')
  const [activeSort, setActiveSort] = useState<keyof typeof sortOptions | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [durationFilter, setDurationFilter] = useState<Enums<'course_duration'> | null>(null)
  const [statusFilter, setStatusFilter] = useState<Course['status'] | null>(null)
  const [typeFilter, setTypeFilter] = useState<'introductory' | 'skills' | null>(null)

  const oppositeSortDirection = useMemo(() => (sortDirection === 'asc' ? 'desc' : 'asc'), [sortDirection])

  const hasActiveFilters = useMemo(
    () => !!(durationFilter || statusFilter || typeFilter),
    [durationFilter, statusFilter, typeFilter],
  )

  const filteredCourses = useMemo(
    () =>
      courses
        .filter(course => {
          if (activeTab !== 'all' && activeTab !== course.status) return false

          if (durationFilter) {
            if (durationFilter === 'short' && course.duration === 'short') return false
            if (durationFilter === 'medium' && course.duration === 'medium') return false
            if (durationFilter === 'long' && course.duration === 'long') return false
          }

          return true
        })
        .sort((a, b) => {
          if (activeSort === 'name')
            return sortDirection === 'asc'
              ? localize(a.title).localeCompare(localize(b.title))
              : localize(b.title).localeCompare(localize(a.title))
          if (activeSort === 'progress')
            return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
          if (activeSort === 'type')
            return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
          if (activeSort === 'duration')
            return a.duration && b.duration
              ? sortDirection === 'asc'
                ? durationSortOrder.indexOf(a.duration) - durationSortOrder.indexOf(b.duration)
                : durationSortOrder.indexOf(b.duration) - durationSortOrder.indexOf(a.duration)
              : 0
          return 0
        }),
    [activeTab, activeSort, courses, durationFilter, localize, sortDirection],
  )

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'all' | Course['status'])
  }, [])

  const handleSortChange = (sort: keyof typeof sortOptions) => () => {
    if (sort === activeSort) setSortDirection(oppositeSortDirection)
    if (!activeSort || activeSort !== sort) {
      setActiveSort(sort)
      setSortDirection('asc')
    }
    setSortDropdownOpen(true)
  }

  const handleSortDirectionChange = useCallback(
    () => (e: React.MouseEvent) => {
      e.stopPropagation()
      setSortDirection(oppositeSortDirection)
      setSortDropdownOpen(false)
    },
    [oppositeSortDirection],
  )

  const handleSortItemSelect = useCallback((e: Event) => {
    e.preventDefault()
  }, [])

  const clearSort = useCallback(() => {
    setActiveSort(null)
    setSortDirection(null)
  }, [])

  const clearAllFilters = useCallback(() => {
    clearSort()
    setDurationFilter(null)
    setStatusFilter(null)
    setTypeFilter(null)
  }, [clearSort])

  const sortButtonContent = useMemo(
    () => (
      <>
        <span className="mr-1.5">{t('sortBy')}</span>
        {activeSort && (
          <span className="mr-0.5 text-xs font-medium text-muted-foreground">{sortOptions[activeSort]}</span>
        )}
        {activeSort ? (
          sortDirection === 'asc' ? (
            <ArrowUpIcon className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 text-muted-foreground" />
          )
        ) : (
          <ArrowUpDownIcon className="h-3 w-3" />
        )}
      </>
    ),
    [activeSort, sortDirection, sortOptions, t],
  )

  return (
    <div className="flex h-full flex-col px-8">
      <div className="border-b">
        <div className="container pb-4">
          <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <div className="container grow py-6">
        <Tabs defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-6 flex h-auto flex-col justify-between gap-4 sm:flex-row">
            <TabsList className="h-9 p-0.5">
              <TabsTrigger value="all">{t('coursesAll')}</TabsTrigger>
              <TabsTrigger value="not_started">{t('coursesNotStarted')}</TabsTrigger>
              <TabsTrigger value="in_progress">{t('coursesInProgress')}</TabsTrigger>
              <TabsTrigger value="completed">{t('coursesCompleted')}</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu onOpenChange={setSortDropdownOpen} open={sortDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button className="group h-9 gap-0 hover:bg-card has-[>svg]:px-3" size="sm" variant="outline">
                    {sortButtonContent}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>{t('sortCourseBy')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(sortOptions).map(([key, label]) => {
                    const option = key as keyof typeof sortOptions

                    return (
                      (option !== 'progress' || (activeTab !== 'not_started' && activeTab !== 'completed')) && (
                        <DropdownMenuItem
                          className={cn(
                            'group flex h-9 cursor-pointer items-center justify-between',
                            activeSort === option && 'bg-accent dark:bg-background/40',
                          )}
                          key={key}
                          onClick={handleSortChange(option)}
                          onSelect={handleSortItemSelect}
                        >
                          <span className={cn('text-foreground/90', activeSort === option && 'text-foreground')}>
                            {label}
                          </span>
                          {activeSort === option && sortDirection && (
                            <div className="flex items-center gap-1">
                              <Button
                                className="h-6 w-6 transition-none group-hover:border hover:bg-card"
                                hover={false}
                                onClick={handleSortDirectionChange}
                                size="icon"
                              >
                                {sortDirection === 'asc' ? (
                                  <ArrowUpIcon className="h-3 w-3" />
                                ) : (
                                  <ArrowDownIcon className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </DropdownMenuItem>
                      )
                    )
                  })}
                  {activeSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearSort}>
                        <XIcon className="mr-2 h-4 w-4" />
                        {t('clearSort')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    {nameSort ? (
                      nameSort === CourseSort.Asc ? (
                        <ArrowDownAZIcon className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowUpAZIcon className="mr-1 h-4 w-4" />
                      )
                    ) : (
                      <SlidersHorizontalIcon className="mr-1 h-4 w-4" />
                    )}
                    {t('filterName')}
                    {nameSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('sortByName')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setNameSort(CourseSort.Asc)}>
                    <ArrowDownAZIcon className="mr-1 h-4 w-4" />
                    {t('sortAtoZ')}
                    {nameSort === CourseSort.Asc && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNameSort(CourseSort.Desc)}>
                    <ArrowUpAZIcon className="mr-1 h-4 w-4" />
                    {t('sortZtoA')}
                    {nameSort === CourseSort.Desc && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  {nameSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setNameSort(null)}>
                        <XIcon className="mr-1 h-4 w-4" />
                        {t('clearFilter')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu> */}
              {/* {activeTab !== 'not-started' && activeTab !== 'completed' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-9" size="sm" variant="outline">
                      <PercentIcon className="mr-2 h-4 w-4" />
                      {t('completion')}
                      {progressSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('sortByCompletion')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setProgressSort('asc')}>
                      {t('sortLowestFirst')}
                      {progressSort === 'asc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgressSort('desc')}>
                      {t('sortHighestFirst')}
                      {progressSort === 'desc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuItem>
                    {progressSort && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setProgressSort(null)}>
                          <XIcon className="mr-2 h-4 w-4" />
                          {t('clearFilter')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )} */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    {t('filtersMore')}
                    {(durationFilter || difficultyFilter || (statusFilter && activeTab === 'all')) && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('filterOptions')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activeTab === 'all' && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <TagsIcon className="mr-2 h-4 w-4" />
                        {t('status')}
                        {statusFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setStatusFilter('not-started')}>
                            {t('statusNotStarted')}
                            {statusFilter === 'not-started' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
                            {t('statusInProgress')}
                            {statusFilter === 'in-progress' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                            {t('statusCompleted')}
                            {statusFilter === 'completed' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          {statusFilter && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                <XIcon className="mr-2 h-4 w-4" />
                                {t('clearFilter')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <StarIcon className="mr-2 h-4 w-4" />
                      {t('difficulty')}
                      {difficultyFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('beginner')}>
                          {t('difficultyBeginner')}
                          {difficultyFilter === 'beginner' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('intermediate')}>
                          {t('difficultyIntermediate')}
                          {difficultyFilter === 'intermediate' && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('advanced')}>
                          {t('difficultyAdvanced')}
                          {difficultyFilter === 'advanced' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        {difficultyFilter && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDifficultyFilter(null)}>
                              <XIcon className="mr-2 h-4 w-4" />
                              {t('clearFilter')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {t('duration')}
                      {durationFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setDurationFilter('short')}>
                          {t('durationShort')}
                          {durationFilter === 'short' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDurationFilter('medium')}>
                          {t('durationMedium')}
                          {durationFilter === 'medium' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDurationFilter('long')}>
                          {t('durationLong')}
                          {durationFilter === 'long' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        {durationFilter && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDurationFilter(null)}>
                              <XIcon className="mr-2 h-4 w-4" />
                              {t('clearFilter')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearAllFilters}>
                        <XIcon className="mr-2 h-4 w-4" />
                        {t('clearAllFilters')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu> */}
              {hasActiveFilters && (
                <Button className="h-9" onClick={clearAllFilters} size="sm" variant="ghost">
                  <XIcon className="mr-1 h-4 w-4" />
                  {t('clearAllFilters')}
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {/* {nameSort && (
                <Badge className="flex items-center gap-1" color="secondary">
                  {t('filterName')}
                  {': '}
                  {nameSort === CourseSort.Asc ? t('sortAtoZ') : t('sortZtoA')}
                  <Button className="h-3 w-3" onClick={() => setNameSort(null)} size="icon" variant="link">
                    <XIcon className="ml-1 size-5 text-zinc-950" />
                  </Button>
                </Badge>
              )} */}
              {/* {progressSort && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {t('completion')}
                  {': '}
                  {progressSort === 'asc' ? 'Lowest First' : 'Highest First'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setProgressSort(null)} />
                </Badge>
              )} */}
              {durationFilter && (
                <Badge className="flex items-center gap-1" color="secondary">
                  {t('duration')}
                  {': '}
                  {durationFilter === 'short' ? 'Short' : durationFilter === 'medium' ? 'Medium' : 'Long'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDurationFilter(null)} />
                </Badge>
              )}
              {/* {statusFilter && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {t('status')}
                  {': '}
                  {statusFilter === 'not-started' ? 'Not Started' : statusFilter === 'in-progress' ? 'In Progress' : 'Completed'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setStatusFilter(null)} />
                </Badge>
              )} */}
            </div>
          )}

          <TabsContent className="space-y-4 pb-2" value={activeTab}>
            {filteredCourses.length === 0 ? (
              <div className="flex h-full flex-col items-center pt-10 text-center">
                <NoResultsGraphic className="mb-8" width={300} />
                <h3 className="text-xl font-medium">{t('noCoursesFound')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {activeTab === 'not_started' && t('emptyListNotStarted')}
                  {activeTab === 'in_progress' && t('emptyListInProgress')}
                  {activeTab === 'completed' && t('emptyListCompleted')}
                  {activeTab === 'all' && t('emptyListAll')}
                </p>
                {hasActiveFilters && (
                  <Button className="mt-4 border" onClick={clearAllFilters} size="sm" variant="outline">
                    <XIcon className="mr-2 h-4 w-4" />
                    {t('clearAllFilters')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCourses.map(course => (
                  <CourseCard course={course} key={course.id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
