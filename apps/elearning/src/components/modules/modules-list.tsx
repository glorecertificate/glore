'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ModuleStatus } from '@/api/modules'
import { ModuleCard } from '@/components/modules/module-card'
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
import { Image } from '@/components/ui/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLocale } from '@/hooks/use-locale'
import { Asset } from '@/lib/storage'
import { cn, localize } from '@/lib/utils'
import { type Enums } from 'supabase/types'

const difficultySortOrder: Enums<'module_difficulty'>[] = ['beginner', 'intermediate', 'advanced']
const durationSortOrder: Enums<'module_duration'>[] = ['short', 'medium', 'long']

export const ModulesList = () => {
  const dashboard = useDashboard()
  const [locale] = useLocale()
  const t = useTranslations('Modules')

  const modules = useMemo(() => localize(dashboard.modules, locale), [dashboard.modules, locale])
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

  const [activeTab, setActiveTab] = useState<'all' | ModuleStatus>('all')
  const [activeSort, setActiveSort] = useState<keyof typeof sortOptions | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState<Enums<'module_difficulty'> | null>(null)
  const [durationFilter, setDurationFilter] = useState<Enums<'module_duration'> | null>(null)
  const [statusFilter, setStatusFilter] = useState<ModuleStatus | null>(null)
  const [typeFilter, setTypeFilter] = useState<'introductory' | 'skills' | null>(null)

  const hasActiveFilters = useMemo(
    () => !!(durationFilter || difficultyFilter || statusFilter || typeFilter),
    [durationFilter, difficultyFilter, statusFilter, typeFilter],
  )

  const filteredModules = useMemo(
    () =>
      modules
        .filter(module => {
          switch (activeTab) {
            case ModuleStatus.NotStarted:
              if (module.status !== ModuleStatus.NotStarted) return false
              break
            case ModuleStatus.InProgress:
              if (module.status !== ModuleStatus.InProgress) return false
              break
            case ModuleStatus.Completed:
              if (module.status !== ModuleStatus.Completed) return false
          }

          // if (statusFilter && module.status !== statusFilter) return false
          if (difficultyFilter && module.difficulty !== difficultyFilter) return false

          if (durationFilter) {
            if (durationFilter === 'short' && module.duration === 'short') return false
            if (durationFilter === 'medium' && module.duration === 'medium') return false
            if (durationFilter === 'long' && module.duration === 'long') return false
          }

          return true
        })
        .sort((a, b) => {
          if (activeSort === 'name')
            return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
          if (activeSort === 'progress') return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
          if (activeSort === 'type') return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
          if (activeSort === 'difficulty')
            return a.difficulty && b.difficulty
              ? sortDirection === 'asc'
                ? difficultySortOrder.indexOf(a.difficulty) - difficultySortOrder.indexOf(b.difficulty)
                : difficultySortOrder.indexOf(b.difficulty) - difficultySortOrder.indexOf(a.difficulty)
              : 0
          if (activeSort === 'duration')
            return a.duration && b.duration
              ? sortDirection === 'asc'
                ? durationSortOrder.indexOf(a.duration) - durationSortOrder.indexOf(b.duration)
                : durationSortOrder.indexOf(b.duration) - durationSortOrder.indexOf(a.duration)
              : 0
          return 0
        }),
    [activeTab, activeSort, difficultyFilter, durationFilter, modules, sortDirection],
  )

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ModuleStatus | 'all')
    // if (value === 'not-started' || value === 'completed') {
    //   setProgressSort(null)
    // }
    // if (value !== 'all') {
    //   setStatusFilter(null)
    // }
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
    (direction: 'asc' | 'desc') => (e: React.MouseEvent) => {
      e.stopPropagation()
      setSortDirection(direction)
      setSortDropdownOpen(true)
    },
    [],
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
    setDifficultyFilter(null)
    setDurationFilter(null)
    setStatusFilter(null)
    setTypeFilter(null)
  }, [clearSort])

  const sortButtonContent = useMemo(
    () => (
      <>
        <span className="mr-1.5">{t('sortBy')}</span>
        {activeSort && <span className="mr-0.5 text-xs font-medium text-muted-foreground">{sortOptions[activeSort]}</span>}
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
    [activeSort, sortDirection, t, sortOptions],
  )

  const oppositeSortDirection = useMemo(() => (sortDirection === 'asc' ? 'desc' : 'asc'), [sortDirection])

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
              <TabsTrigger value="all">{t('modulesAll')}</TabsTrigger>
              <TabsTrigger value={ModuleStatus.NotStarted}>{t('modulesNotStarted')}</TabsTrigger>
              <TabsTrigger value={ModuleStatus.InProgress}>{t('modulesInProgress')}</TabsTrigger>
              <TabsTrigger value={ModuleStatus.Completed}>{t('modulesCompleted')}</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu onOpenChange={setSortDropdownOpen} open={sortDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9 gap-0 hover:bg-card has-[>svg]:px-3" size="sm" variant="outline">
                    {sortButtonContent}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>{t('sortModuleBy')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(sortOptions).map(([key, label]) => {
                    const option = key as keyof typeof sortOptions

                    return (
                      (option !== 'progress' ||
                        (activeTab !== ModuleStatus.NotStarted && activeTab !== ModuleStatus.Completed)) && (
                        <DropdownMenuItem
                          className={cn(
                            'group flex h-9 cursor-pointer items-center justify-between',
                            activeSort === option && 'bg-accent dark:bg-background/40',
                          )}
                          key={key}
                          onClick={handleSortChange(option)}
                          onSelect={handleSortItemSelect}
                        >
                          <span className={cn('text-foreground/90', activeSort === option && 'text-foreground')}>{label}</span>
                          {activeSort === option && sortDirection && (
                            <div className="flex items-center gap-1">
                              <Button
                                className="h-6 w-6 transition-none group-hover:border hover:bg-card"
                                hover={false}
                                onClick={handleSortDirectionChange(oppositeSortDirection)}
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
                      nameSort === ModuleSort.Asc ? (
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
                  <DropdownMenuItem onClick={() => setNameSort(ModuleSort.Asc)}>
                    <ArrowDownAZIcon className="mr-1 h-4 w-4" />
                    {t('sortAtoZ')}
                    {nameSort === ModuleSort.Asc && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNameSort(ModuleSort.Desc)}>
                    <ArrowUpAZIcon className="mr-1 h-4 w-4" />
                    {t('sortZtoA')}
                    {nameSort === ModuleSort.Desc && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
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
                  {nameSort === ModuleSort.Asc ? t('sortAtoZ') : t('sortZtoA')}
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
              {difficultyFilter && (
                <Badge className="flex items-center gap-1" color="secondary">
                  {t('difficulty')}
                  {': '}
                  {difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDifficultyFilter(null)} />
                </Badge>
              )}
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
            {filteredModules.length === 0 ? (
              <div className="flex h-full flex-col items-center pt-10 text-center">
                <Image className="mb-8" src={Asset.NoResults} width={300} />
                <h3 className="text-xl font-medium">{t('noModulesFound')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {activeTab === ModuleStatus.NotStarted && t('emptyListNotStarted')}
                  {activeTab === ModuleStatus.InProgress && t('emptyListInProgress')}
                  {activeTab === ModuleStatus.Completed && t('emptyListCompleted')}
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
                {filteredModules.map(module => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
