'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'

import { type Course } from '@/api/modules/courses/types'
import { CourseCard } from '@/components/features/course-card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const CoursesList = () => {
  const { localize } = useLocale()
  const { courses, user } = useSession()
  const t = useTranslations('Courses')

  const sortOptions = useMemo(
    () => ({
      name: t('sortByName'),
      progress: t('sortByProgress'),
      type: t('sortByType'),
      difficulty: t('sortByDifficulty'),
    }),
    [t],
  )
  const [activeTab, setActiveTab] = useState<'all' | Course['status'] | Course['publicationStatus']>('all')
  const [activeSort, setActiveSort] = useState<keyof typeof sortOptions | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  const canEdit = useMemo(() => user.isAdmin || user.isEditor, [user])
  const oppositeSortDirection = useMemo(() => (sortDirection === 'asc' ? 'desc' : 'asc'), [sortDirection])

  const filteredCourses = useMemo(
    () =>
      courses.sort((a, b) => {
        if (activeSort === 'name')
          return sortDirection === 'asc'
            ? localize(a.title).localeCompare(localize(b.title))
            : localize(b.title).localeCompare(localize(a.title))
        if (activeSort === 'progress')
          return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
        if (activeSort === 'type')
          return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
        return 0
      }),
    [activeSort, sortDirection, courses, localize],
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

  const courseDescription = useMemo(
    () => (user.isAdmin ? t('descriptionAdmin') : user.isEditor ? t('descriptionEditor') : t('description')),
    [t, user.isAdmin, user.isEditor],
  )

  return (
    <div className="flex h-full flex-col px-8">
      <div className="border-b">
        <div className="container pb-4">
          <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{courseDescription}</p>
        </div>
      </div>
      <div className="container grow py-6">
        <Tabs className="h-full" defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-6 flex h-auto flex-col justify-between gap-4 sm:flex-row">
            {canEdit ? (
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="all">{t('coursesAll')}</TabsTrigger>
                <TabsTrigger value="active">{t('coursesActive')}</TabsTrigger>
                <TabsTrigger value="draft">{t('coursesDraft')}</TabsTrigger>
                <TabsTrigger value="archived">{t('coursesArchived')}</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="all">{t('coursesAll')}</TabsTrigger>
                <TabsTrigger value="not_started">{t('coursesNotStarted')}</TabsTrigger>
                <TabsTrigger value="in_progress">{t('coursesInProgress')}</TabsTrigger>
                <TabsTrigger value="completed">{t('coursesCompleted')}</TabsTrigger>
              </TabsList>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              {canEdit && (
                <Button asChild color="secondary">
                  <Link href={Route.CourseNew}>{t('newCourse')}</Link>
                </Button>
              )}
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
            </div>
          </div>

          <TabsContent className="grow space-y-4 pb-2" value={activeTab}>
            {filteredCourses.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center pt-10 text-center">
                <NoResultsGraphic className="mb-8 w-64" />
                <h3 className="text-xl font-medium">{t('noCoursesFound')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {activeTab === 'all' && t('emptyListAll')}
                  {activeTab === 'not_started' && t('emptyListNotStarted')}
                  {activeTab === 'in_progress' && t('emptyListInProgress')}
                  {activeTab === 'completed' && t('emptyListCompleted')}
                  {activeTab === 'active' && t('emptyListActive')}
                  {activeTab === 'draft' && t('emptyListDraft')}
                  {activeTab === 'archived' && t('emptyListArchived')}
                </p>
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
