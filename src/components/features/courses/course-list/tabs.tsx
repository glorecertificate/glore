'use client'

import { ArchiveIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CourseLanguagesProvider } from '@/components/features/courses/course-languages'
import { type CourseListTab } from '@/components/features/courses/course-list/params'
import {
  useCourseList,
  useCourseListParams,
  useCourseListTab,
  useCourseListTabs,
} from '@/components/features/courses/course-list/use-params'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { camelize, cn } from '@/lib/utils'

const CourseListTabsTrigger = ({
  className,
  count,
  value,
  ...props
}: React.ComponentProps<typeof TabsTrigger> & {
  count: number
  value: CourseListTab
}) => {
  const t = useTranslations('Courses')

  if (value === 'archived') {
    return (
      <TabsTrigger className={cn('p-0', className)} value={value} {...props}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <span className="inline-block px-3.5">
              <ArchiveIcon />
            </span>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1 leading-[normal]" sideOffset={16}>
            {t('archive')}
            {count > 0 && <small className="text-muted">{count}</small>}
          </TooltipContent>
        </Tooltip>
      </TabsTrigger>
    )
  }

  return (
    <TabsTrigger
      effect="text-stroke"
      className={cn('rounded-lg', className)}
      count={count}
      size="sm"
      value={value}
      {...props}
    >
      {t(value)}
    </TabsTrigger>
  )
}

export const CourseListTabsList = ({
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsList>, 'children'>) => {
  const { tabs } = useCourseListTabs()
  const { courseList } = useCourseList()

  return (
    <TabsList className={cn('w-full rounded-lg sm:w-fit', className)} {...props}>
      {tabs.map(tab => (
        <CourseListTabsTrigger count={courseList[camelize(tab)].length} key={tab} value={tab} />
      ))}
    </TabsList>
  )
}

export const CourseListTabs = ({ children, ...props }: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useCourseListTab()
  useCourseListParams()

  return (
    <CourseLanguagesProvider>
      <Tabs
        animated
        className="gap-2"
        defaultValue="all"
        onValueChange={value => setTab(value as CourseListTab)}
        value={tab}
        {...props}
      >
        {children}
      </Tabs>
    </CourseLanguagesProvider>
  )
}
