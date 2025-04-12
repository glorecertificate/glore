'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownAZIcon, ArrowUpAZIcon, HistoryIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ModuleStatus, type Module } from '@/api/modules'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLocale } from '@/hooks/use-locale'
import { localize } from '@/lib/utils'

import { ModuleCard } from './module-card'

enum ModuleSort {
  Asc = 'asc',
  Desc = 'desc',
}

enum ModuleDateSort {
  Newest = 'newest',
  Oldest = 'oldest',
}

export const ModulesList = () => {
  const dashboard = useDashboard()
  const [locale] = useLocale()
  const t = useTranslations('Modules')

  const modules = useMemo(() => localize(dashboard.modules, locale), [dashboard.modules, locale])

  const [activeTab, setActiveTab] = useState<'all' | ModuleStatus>('all')
  const [nameSort, setNameSort] = useState<ModuleSort | null>(null)
  // const [progressSort, setProgressSort] = useState<ModuleSort | null>(null)
  const [dateSort, setDateSort] = useState<ModuleDateSort | null>(null)
  const [durationFilter, setDurationFilter] = useState<Module['duration']>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<Module['difficulty']>(null)
  // const [statusFilter, setStatusFilter] = useState<ModuleStatus | null>(null)

  const hasActiveFilters = useMemo(
    // nameSort || progressSort || dateSort || durationFilter || difficultyFilter || statusFilter,
    () => nameSort || dateSort || durationFilter || difficultyFilter,
    [nameSort, dateSort, durationFilter, difficultyFilter],
  )

  const filteredModules = useMemo(
    () =>
      modules
        .filter(module => {
          // if (activeTab === 'not-started' && module.status !== 'not-started') return false
          // if (activeTab === 'in-progress' && module.status !== 'in-progress') return false
          // if (activeTab === 'completed' && module.status !== 'completed') return false

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
          if (nameSort === ModuleSort.Asc) {
            return a.title.localeCompare(b.title)
          }
          if (nameSort === ModuleSort.Desc) {
            return b.title.localeCompare(a.title)
          }
          // if (progressSort === 'asc') {
          //   return a.progress - b.progress
          // }
          // if (progressSort === 'desc') {
          //   return b.progress - a.progress
          // }
          if (dateSort === ModuleDateSort.Newest) {
            if (!a.created_at || !b.created_at) return 0
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          if (dateSort === ModuleDateSort.Oldest) {
            if (!a.created_at || !b.created_at) return 0
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          }
          return a.title.localeCompare(b.title)
        }),
    [dateSort, difficultyFilter, durationFilter, nameSort, modules],
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

  const clearAllFilters = useCallback(() => {
    setNameSort(null)
    // setProgressSort(null)
    setDateSort(null)
    setDurationFilter(null)
    setDifficultyFilter(null)
    // setStatusFilter(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col px-8">
      <div className="border-b">
        <div className="container pb-4">
          <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <div className="container py-6">
        <Tabs defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-6 flex h-auto flex-col justify-between gap-4 sm:flex-row">
            <TabsList className="flex w-full border md:w-auto">
              <TabsTrigger className="text-[12.5px] font-normal md:text-sm" value="all">
                {t('modulesAll')}
              </TabsTrigger>
              <TabsTrigger className="text-[12.5px] font-normal md:text-sm" value={ModuleStatus.NotStarted}>
                {t('modulesNotStarted')}
              </TabsTrigger>
              <TabsTrigger className="text-[12.5px] font-normal md:text-sm" value={ModuleStatus.InProgress}>
                {t('modulesInProgress')}
              </TabsTrigger>
              <TabsTrigger className="text-[12.5px] font-normal md:text-sm" value={ModuleStatus.Completed}>
                {t('modulesCompleted')}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
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
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    <HistoryIcon className="mr-1 h-4 w-4" />
                    {t('date')}
                    {dateSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('sortByDate')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDateSort(ModuleDateSort.Newest)}>
                    {t('sortNewestFirst')}
                    {dateSort === ModuleDateSort.Newest && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateSort(ModuleDateSort.Oldest)}>
                    {t('sortOldestFirst')}
                    {dateSort === ModuleDateSort.Oldest && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  {dateSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDateSort(null)}>
                        <XIcon className="mr-1 h-4 w-4" />
                        {t('clearFilter')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
              {nameSort && (
                <Badge className="flex items-center gap-1" color="secondary">
                  {t('filterName')}
                  {': '}
                  {nameSort === ModuleSort.Asc ? t('sortAtoZ') : t('sortZtoA')}
                  <Button className="h-3 w-3" onClick={() => setNameSort(null)} size="icon" variant="link">
                    <XIcon className="ml-1 size-5 text-zinc-950" />
                  </Button>
                </Badge>
              )}
              {/* {progressSort && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {t('completion')}
                  {': '}
                  {progressSort === 'asc' ? 'Lowest First' : 'Highest First'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setProgressSort(null)} />
                </Badge>
              )} */}
              {dateSort && (
                <Badge className="flex items-center gap-1" color="secondary">
                  {t('date')}
                  {': '}
                  {dateSort === ModuleDateSort.Newest ? 'Newest First' : 'Oldest First'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDateSort(null)} />
                </Badge>
              )}
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

          <TabsContent className="space-y-4" value={activeTab}>
            {filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-xl font-medium">{t('noModulesFound')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {activeTab === ModuleStatus.NotStarted && "You've started all available modules!"}
                  {activeTab === ModuleStatus.InProgress && "You don't have any modules in progress."}
                  {activeTab === ModuleStatus.Completed && "You haven't completed any modules yet."}
                  {activeTab === 'all' && 'There are no modules available with the current filters.'}
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
