'use client'

import { useMemo } from 'react'

import { ArchiveIcon } from 'lucide-react'

import { type CourseListTab, useCourseList } from '@/components/features/courses/course-list/course-list-context'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Translator } from '@/lib/i18n'
import { camelize, cn } from '@/lib/utils'

export const CourseListTabs = ({ children, ...props }: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useCourseList()

  return (
    <Tabs defaultValue="all" onValueChange={value => setTab(value as CourseListTab)} value={tab} {...props}>
      {children}
    </Tabs>
  )
}

export const CourseListTabsTrigger = ({
  className,
  count,
  t,
  value,
  ...props
}: React.ComponentProps<typeof TabsTrigger> & {
  count: number
  t: Translator<'Courses'>
  value: CourseListTab
}) => {
  const archiveTooltip = useMemo(() => {
    if (value !== 'archived') return null
    if (count === 0) return t('archive')
    return (
      <span className="flex items-center gap-1">
        {t('archive')}
        <small className="text-background/70 leading-0">{count}</small>
      </span>
    )
  }, [count, value, t])

  if (value === 'archived')
    return (
      <TabsTrigger className={cn('p-0', className)} value={value} {...props}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <span className="inline-block px-3.5">
              <ArchiveIcon />
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={14}>{archiveTooltip}</TooltipContent>
        </Tooltip>
      </TabsTrigger>
    )

  return (
    <TabsTrigger className={cn('rounded-xl', className)} count={count} value={value} {...props}>
      {t(value)}
    </TabsTrigger>
  )
}

export const CourseListTabsList = ({ children, className, ...props }: React.ComponentProps<typeof TabsList>) => {
  const { courseList, t, tabs } = useCourseList()

  return (
    <TabsList className={cn('w-full rounded-xl sm:w-fit', className)} {...props}>
      {tabs.map(tab => (
        <CourseListTabsTrigger count={courseList[camelize(tab)].length} key={tab} t={t} value={tab} />
      ))}
    </TabsList>
  )
}
