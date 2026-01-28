'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  COURSE_LIST_EDITOR_SORTS,
  COURSE_LIST_LEARNER_SORTS,
  type CourseListSortType,
  useCourseList,
} from '@/components/features/courses/course-list/course-list-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export const CourseListSort = () => {
  const { sort, sortDirection, t, tab, user, setSort, setSortDirection } = useCourseList()
  const tCommon = useTranslations('Common')

  const [open, setOpen] = useState(false)

  const options = useMemo<Record<CourseListSortType, string>>(() => {
    const sorts = user.canEdit ? COURSE_LIST_EDITOR_SORTS : COURSE_LIST_LEARNER_SORTS
    return sorts.reduce((acc, sort) => ({ ...acc, [sort]: t(sort) }), {} as Record<CourseListSortType, string>)
  }, [t, user.canEdit])

  const icon = useMemo(() => {
    if (!sort) return <ChevronsUpDownIcon className="size-3.5" />
    const Icon = sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon
    return <Icon className="size-3 text-muted-foreground" />
  }, [sortDirection, sort])

  const handleSortChange = useCallback(
    (type: CourseListSortType) => () => {
      if (type === sort) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
      if (!type || type !== sort) setSort(type)
      setOpen(true)
    },
    [setSortDirection, setSort, sort]
  )

  const clearSort = useCallback(() => {
    setSort(null)
    setSortDirection(null)
  }, [setSortDirection, setSort])

  const ArrowIcon = sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button className="group h-9 gap-0 has-[>svg]:px-3" size="sm" variant="outline">
          <span className="mr-1.5">{t('sortBy')}</span>
          {sort && <span className="mr-0.5 font-medium text-muted-foreground text-xs">{options[sort]}</span>}
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('sortBy')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.entries(options) as [CourseListSortType, string][]).map(
          ([option, label]) =>
            (option !== 'progress' || (tab !== 'not_started' && tab !== 'completed')) && (
              <DropdownMenuItem
                active={sort === option}
                className="group/sort-menu-item h-9 cursor-pointer justify-between"
                key={option}
                onClick={handleSortChange(option)}
                onSelect={e => e.preventDefault()}
              >
                <span className={cn('text-foreground/90', sort === option && 'text-foreground')}>{label}</span>
                <Button
                  className={cn(
                    'size-5 opacity-0 group-hover/sort-menu-item:[&>svg]:text-foreground',
                    sort === option && 'opacity-100'
                  )}
                  size="icon"
                  variant="ghost"
                >
                  <ArrowIcon className="size-3.5 transition-all" />
                </Button>
              </DropdownMenuItem>
            )
        )}
        {sort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearSort}>
              <XIcon className="mr-1 size-4" />
              {tCommon('clearSort')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
