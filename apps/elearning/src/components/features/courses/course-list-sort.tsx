'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/hooks/use-session'
import { type CourseListView } from '@/lib/navigation'
import { cn } from '@/lib/utils'

const EDITOR_SORTS = ['name', 'type', 'skillGroup', 'name', 'creationDate', 'lastUpdated'] as const
const LEARNER_SORTS = ['progress', 'type', 'skillGroup', 'name'] as const

export type CourseListSortType = 'default' | (typeof EDITOR_SORTS)[number] | (typeof LEARNER_SORTS)[number]
export type CourseListSortDirection = 'asc' | 'desc'

export const CourseListSort = ({
  direction,
  setDirection,
  setValue,
  tab,
  value,
}: {
  direction: CourseListSortDirection | null
  setDirection: React.Dispatch<React.SetStateAction<CourseListSortDirection | null>>
  tab: CourseListView
  value: CourseListSortType | null
  setValue: React.Dispatch<React.SetStateAction<CourseListSortType | null>>
}) => {
  const { user } = useSession()
  const tCourses = useTranslations('Courses')
  const t = useTranslations('Common')
  const [open, setOpen] = useState(false)

  const options = useMemo<Record<CourseListSortType, string>>(() => {
    const sorts = user.canEdit ? EDITOR_SORTS : LEARNER_SORTS
    return sorts.reduce((acc, sort) => ({ ...acc, [sort]: tCourses(sort) }), {} as Record<CourseListSortType, string>)
  }, [tCourses, user.canEdit])

  const icon = useMemo(() => {
    if (!value) return <ChevronsUpDownIcon className="size-3.5" />
    const Icon = direction === 'asc' ? ArrowUpIcon : ArrowDownIcon
    return <Icon className="size-3 text-muted-foreground" />
  }, [direction, value])

  const handleSortChange = useCallback(
    (sort: CourseListSortType) => () => {
      if (sort === value) setDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
      if (!value || value !== sort) setValue(sort)
      setOpen(true)
    },
    [setDirection, setValue, value]
  )

  const clearSort = useCallback(() => {
    setValue(null)
    setDirection(null)
  }, [setDirection, setValue])

  const ArrowIcon = direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button className="group h-9 gap-0 has-[>svg]:px-3" size="sm" variant="outline">
          <span className="mr-1.5">{t('sortBy')}</span>
          {value && <span className="mr-0.5 font-medium text-muted-foreground text-xs">{options[value]}</span>}
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t('sortBy')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.entries(options) as [CourseListSortType, string][]).map(
          ([option, label]) =>
            (option !== 'progress' || (tab !== 'not_started' && tab !== 'completed')) && (
              <DropdownMenuItem
                active={value === option}
                className="group/sort-menu-item h-9 cursor-pointer justify-between"
                key={option}
                onClick={handleSortChange(option)}
                onSelect={e => e.preventDefault()}
              >
                <span className={cn('text-foreground/90', value === option && 'text-foreground')}>{label}</span>
                {value === option && (
                  <Button
                    className="size-5 group-hover/sort-menu-item:[&>svg]:text-foreground"
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowIcon className="size-3.5 transition-all" />
                  </Button>
                )}
              </DropdownMenuItem>
            )
        )}
        {value && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearSort}>
              <XIcon className="mr-1 size-4" />
              {t('clearSort')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
