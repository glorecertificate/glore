'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  ClockIcon,
  FilterIcon,
  HistoryIcon,
  PercentIcon,
  SlidersHorizontalIcon,
  StarIcon,
  TagsIcon,
  XIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ModuleProgress } from '@/lib/types'

import { ModuleCard } from './module-card'

const modules: ModuleProgress[] = [
  {
    id: '1',
    title: 'Introduction to Volunteering',
    description: 'Learn the basics of volunteering and its impact on communities.',
    progress: 0,
    status: 'not-started',
    totalLessons: 5,
    completedLessons: 0,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'beginner',
    duration: 60, // in minutes
    dateAdded: '2023-11-15',
  },
  {
    id: '2',
    title: 'Community Engagement',
    description: 'Discover strategies for effective community engagement and outreach.',
    progress: 35,
    status: 'in-progress',
    totalLessons: 8,
    completedLessons: 3,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'intermediate',
    duration: 120,
    dateAdded: '2023-10-05',
  },
  {
    id: '3',
    title: 'Project Management for Volunteers',
    description: 'Master the skills needed to manage volunteer projects successfully.',
    progress: 75,
    status: 'in-progress',
    totalLessons: 6,
    completedLessons: 4,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'advanced',
    duration: 180,
    dateAdded: '2023-09-22',
  },
  {
    id: '4',
    title: 'Leadership in Volunteer Organizations',
    description: 'Develop leadership skills for guiding volunteer teams and initiatives.',
    progress: 100,
    status: 'completed',
    totalLessons: 7,
    completedLessons: 7,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'advanced',
    duration: 240,
    dateAdded: '2023-08-30',
  },
  {
    id: '5',
    title: 'Fundraising Fundamentals',
    description: 'Learn essential strategies for fundraising to support volunteer initiatives.',
    progress: 100,
    status: 'completed',
    totalLessons: 4,
    completedLessons: 4,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'intermediate',
    duration: 90,
    dateAdded: '2023-12-10',
  },
  {
    id: '6',
    title: 'Effective Communication Skills',
    description: 'Master the art of clear communication in volunteer settings.',
    progress: 50,
    status: 'in-progress',
    totalLessons: 5,
    completedLessons: 2,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'beginner',
    duration: 75,
    dateAdded: '2024-01-05',
  },
  {
    id: '7',
    title: 'Understanding Nonprofit Sector',
    description: 'Learn about the structure and operation of nonprofit organizations.',
    progress: 0,
    status: 'not-started',
    totalLessons: 6,
    completedLessons: 0,
    image: '/placeholder.svg?height=200&width=400',
    difficulty: 'beginner',
    duration: 100,
    dateAdded: '2024-02-15',
  },
]

export const ModulesView = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [nameSort, setNameSort] = useState<'asc' | 'desc' | null>(null)
  const [progressSort, setProgressSort] = useState<'asc' | 'desc' | null>(null)
  const [dateSort, setDateSort] = useState<'newest' | 'oldest' | null>(null)
  const [durationFilter, setDurationFilter] = useState<'short' | 'medium' | 'long' | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null)
  const [statusFilter, setStatusFilter] = useState<'not-started' | 'in-progress' | 'completed' | null>(null)

  const hasActiveFilters = useMemo(
    () => nameSort || progressSort || dateSort || durationFilter || difficultyFilter || statusFilter,
    [nameSort, progressSort, dateSort, durationFilter, difficultyFilter, statusFilter],
  )

  const filteredModules = useMemo(
    () =>
      modules
        .filter(module => {
          if (activeTab === 'not-started' && module.status !== 'not-started') return false
          if (activeTab === 'in-progress' && module.status !== 'in-progress') return false
          if (activeTab === 'completed' && module.status !== 'completed') return false

          if (statusFilter && module.status !== statusFilter) return false
          if (difficultyFilter && module.difficulty !== difficultyFilter) return false
          if (durationFilter) {
            if (durationFilter === 'short' && (module.duration || 0) > 90) return false
            if (durationFilter === 'medium' && ((module.duration || 0) <= 90 || (module.duration || 0) > 180)) return false
            if (durationFilter === 'long' && (module.duration || 0) <= 180) return false
          }

          return true
        })
        .sort((a, b) => {
          if (nameSort === 'asc') {
            return a.title.localeCompare(b.title)
          }
          if (nameSort === 'desc') {
            return b.title.localeCompare(a.title)
          }
          if (progressSort === 'asc') {
            return a.progress - b.progress
          }
          if (progressSort === 'desc') {
            return b.progress - a.progress
          }
          if (dateSort === 'newest') {
            if (!a.dateAdded || !b.dateAdded) return 0
            return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          }
          if (dateSort === 'oldest') {
            if (!a.dateAdded || !b.dateAdded) return 0
            return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
          }
          return a.title.localeCompare(b.title)
        }),
    [activeTab, nameSort, progressSort, dateSort, durationFilter, difficultyFilter, statusFilter],
  )

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)

    if (value === 'not-started' || value === 'completed') {
      setProgressSort(null)
    }
    if (value !== 'all') {
      setStatusFilter(null)
    }
  }, [])

  const clearAllFilters = useCallback(() => {
    setNameSort(null)
    setProgressSort(null)
    setDateSort(null)
    setDurationFilter(null)
    setDifficultyFilter(null)
    setStatusFilter(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container py-4">
          <h1 className="text-3xl font-bold">{'Learning Modules'}</h1>
          <p className="text-muted-foreground">{'Browse and manage your learning journey'}</p>
        </div>
      </header>
      <main className="container flex-1 py-6">
        <Tabs defaultValue="all" onValueChange={handleTabChange} value={activeTab}>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
            <TabsList>
              <TabsTrigger value="all" variant="primary">
                {'All Modules'}
              </TabsTrigger>
              <TabsTrigger value="not-started" variant="primary">
                {'To Start'}
              </TabsTrigger>
              <TabsTrigger value="in-progress" variant="primary">
                {'In Progress'}
              </TabsTrigger>
              <TabsTrigger value="completed" variant="primary">
                {'Completed'}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    {nameSort ? (
                      nameSort === 'asc' ? (
                        <ArrowDownAZIcon className="mr-2 h-4 w-4" />
                      ) : (
                        <ArrowUpAZIcon className="mr-2 h-4 w-4" />
                      )
                    ) : (
                      <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
                    )}
                    {'Name'}
                    {nameSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{'Sort by Name'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setNameSort('asc')}>
                    <ArrowDownAZIcon className="mr-2 h-4 w-4" />
                    {'A to Z'}
                    {nameSort === 'asc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNameSort('desc')}>
                    <ArrowUpAZIcon className="mr-2 h-4 w-4" />
                    {'Z to A'}
                    {nameSort === 'desc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  {nameSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setNameSort(null)}>
                        <XIcon className="mr-2 h-4 w-4" />
                        {'Clear'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {activeTab !== 'not-started' && activeTab !== 'completed' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-9" size="sm" variant="outline">
                      <PercentIcon className="mr-2 h-4 w-4" />
                      {'Completion'}
                      {progressSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{'Sort by Completion'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setProgressSort('asc')}>
                      {'Lowest First'}
                      {progressSort === 'asc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgressSort('desc')}>
                      {'Highest First'}
                      {progressSort === 'desc' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuItem>
                    {progressSort && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setProgressSort(null)}>
                          <XIcon className="mr-2 h-4 w-4" />
                          {'Clear'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    {'Date'}
                    {dateSort && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{'Sort by Date Added'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDateSort('newest')}>
                    {'Newest First'}
                    {dateSort === 'newest' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateSort('oldest')}>
                    {'Oldest First'}
                    {dateSort === 'oldest' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                  </DropdownMenuItem>
                  {dateSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDateSort(null)}>
                        <XIcon className="mr-2 h-4 w-4" />
                        {'Clear'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm" variant="outline">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    {'More Filters'}
                    {(durationFilter || difficultyFilter || (statusFilter && activeTab === 'all')) && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{'Filter Options'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activeTab === 'all' && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <TagsIcon className="mr-2 h-4 w-4" />
                        {'Status'}
                        {statusFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setStatusFilter('not-started')}>
                            {'Not Started'}
                            {statusFilter === 'not-started' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
                            {'In Progress'}
                            {statusFilter === 'in-progress' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                            {'Completed'}
                            {statusFilter === 'completed' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                          </DropdownMenuItem>
                          {statusFilter && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                <XIcon className="mr-2 h-4 w-4" />
                                {'Clear'}
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
                      {'Difficulty'}
                      {difficultyFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('beginner')}>
                          {'Beginner'}
                          {difficultyFilter === 'beginner' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('intermediate')}>
                          {'Intermediate'}
                          {difficultyFilter === 'intermediate' && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDifficultyFilter('advanced')}>
                          {'Advanced'}
                          {difficultyFilter === 'advanced' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        {difficultyFilter && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDifficultyFilter(null)}>
                              <XIcon className="mr-2 h-4 w-4" />
                              {'Clear'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {'Duration'}
                      {durationFilter && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setDurationFilter('short')}>
                          {'Short ('}&lt;{' 90 min)'}
                          {durationFilter === 'short' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDurationFilter('medium')}>
                          {'Medium (90-180 min)'}
                          {durationFilter === 'medium' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDurationFilter('long')}>
                          {'Long ('}&gt;{' 180 min)'}
                          {durationFilter === 'long' && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
                        </DropdownMenuItem>
                        {durationFilter && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDurationFilter(null)}>
                              <XIcon className="mr-2 h-4 w-4" />
                              {'Clear'}
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
                        {'Clear All Filters'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {hasActiveFilters && (
                <Button className="h-9" onClick={clearAllFilters} size="sm" variant="ghost">
                  <XIcon className="mr-2 h-4 w-4" />
                  {'Clear All'}
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {nameSort && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Name: '}
                  {nameSort === 'asc' ? 'A to Z' : 'Z to A'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setNameSort(null)} />
                </Badge>
              )}

              {progressSort && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Completion: '}
                  {progressSort === 'asc' ? 'Lowest First' : 'Highest First'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setProgressSort(null)} />
                </Badge>
              )}

              {dateSort && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Date: '}
                  {dateSort === 'newest' ? 'Newest First' : 'Oldest First'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDateSort(null)} />
                </Badge>
              )}

              {difficultyFilter && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Difficulty: '}
                  {difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDifficultyFilter(null)} />
                </Badge>
              )}

              {durationFilter && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Duration: '}
                  {durationFilter === 'short' ? 'Short' : durationFilter === 'medium' ? 'Medium' : 'Long'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDurationFilter(null)} />
                </Badge>
              )}

              {statusFilter && (
                <Badge className="flex items-center gap-1" variant="secondary">
                  {'Status:'}{' '}
                  {statusFilter === 'not-started' ? 'Not Started' : statusFilter === 'in-progress' ? 'In Progress' : 'Completed'}
                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setStatusFilter(null)} />
                </Badge>
              )}
            </div>
          )}

          <TabsContent className="space-y-4" value={activeTab}>
            {filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-xl font-medium">{'No modules found'}</h3>
                <p className="mt-2 text-muted-foreground">
                  {activeTab === 'not-started' && "You've started all available modules!"}
                  {activeTab === 'in-progress' && "You don't have any modules in progress."}
                  {activeTab === 'completed' && "You haven't completed any modules yet."}
                  {activeTab === 'all' && 'There are no modules available with the current filters.'}
                </p>
                {hasActiveFilters && (
                  <Button className="mt-4" onClick={clearAllFilters} size="sm" variant="outline">
                    <XIcon className="mr-2 h-4 w-4" />
                    {'Clear Filters'}
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
      </main>
    </div>
  )
}
