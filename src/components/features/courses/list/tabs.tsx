'use client'

import { memo, useCallback, useMemo } from 'react'

import { ArchiveIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type CourseListTab } from '@/components/features/courses/list/params'
import {
  useCourseList,
  useCourseListParams,
  useCourseListTab,
  useCourseListTabs,
} from '@/components/features/courses/list/use-params'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { camelize, cn } from '@/lib/utils'

export const CourseListTabs = memo(({ children, ...props }: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useCourseListTab()
  useCourseListParams()

  const handleTabChange = useCallback((value: string) => setTab(value as CourseListTab), [setTab])

  return (
    <Tabs defaultValue="all" onValueChange={handleTabChange} value={tab} {...props}>
      {children}
    </Tabs>
  )
})

export const CourseListTabsTrigger = memo(
  ({
    className,
    count,
    value,
    ...props
  }: React.ComponentProps<typeof TabsTrigger> & {
    count: number
    value: CourseListTab
  }) => {
    const t = useTranslations('Courses')

    const archiveTooltip = useMemo(() => {
      if (value !== 'archived') return null
      if (count === 0) return t('archive')
      return (
        <>
          {t('archive')}
          <small className="text-muted-foreground">{count}</small>
        </>
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
            <TooltipContent className="flex items-center gap-0.5 leading-[normal]" sideOffset={12}>
              {archiveTooltip}
            </TooltipContent>
          </Tooltip>
        </TabsTrigger>
      )

    return (
      <TabsTrigger className={cn('rounded-lg', className)} count={count} size="sm" value={value} {...props}>
        {t(value)}
      </TabsTrigger>
    )
  }
)

export const CourseListTabsList = memo(({ children, className, ...props }: React.ComponentProps<typeof TabsList>) => {
  const { tabs } = useCourseListTabs()
  const { courseList } = useCourseList()

  return (
    <TabsList className={cn('w-full rounded-lg sm:w-fit', className)} {...props}>
      {tabs.map(tab => (
        <CourseListTabsTrigger count={courseList[camelize(tab)].length} key={tab} value={tab} />
      ))}
    </TabsList>
  )
})
