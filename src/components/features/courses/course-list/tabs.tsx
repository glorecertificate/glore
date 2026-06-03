'use client'

import { ArchiveIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type CourseListTab } from '@/components/features/courses/course-list/params'
import {
  useCourseList,
  useCourseListParams,
  useCourseListTab,
  useCourseListTabs,
} from '@/components/features/courses/course-list/use-params'
import { CourseLanguagesProvider } from '@/components/providers/course-languages-context'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { camelize, cn } from '@/lib/utils'

export const CourseListTabs = ({ children, ...props }: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useCourseListTab()
  useCourseListParams()

  const handleTabChange = (value: string) => setTab(value as CourseListTab)

  return (
    <CourseLanguagesProvider>
      <Tabs animated className="gap-6" defaultValue="all" onValueChange={handleTabChange} value={tab} {...props}>
        {children}
      </Tabs>
    </CourseLanguagesProvider>
  )
}

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
    <TabsTrigger className={cn('rounded-lg', className)} count={count} size="sm" value={value} {...props}>
      {t(value)}
    </TabsTrigger>
  )
}

export const CourseListTabsList = ({ children, className, ...props }: React.ComponentProps<typeof TabsList>) => {
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
