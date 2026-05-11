'use client'

import { CourseListDialog } from '@/components/features/courses/list/dialog'
import { CourseListFilterReset } from '@/components/features/courses/list/filter-reset'
import { CourseListLanguageSelect } from '@/components/features/courses/list/language-select'
import { CourseListGroupSelect } from '@/components/features/courses/list/skill-group-select'
import { CourseListSort } from '@/components/features/courses/list/sort'
import { CourseListTabsList } from '@/components/features/courses/list/tabs'
import { CourseListTypeSelect } from '@/components/features/courses/list/type-select'
import {
  PageHeaderBreadcrumb,
  PageHeaderContainer,
  PageHeaderLogo,
  PageHeaderSidebarTrigger,
} from '@/components/layout/page-header'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const CourseListHeader = ({ className, ...props }: React.ComponentProps<typeof PageHeaderContainer>) => {
  const { user } = useSession()
  const descriptionKey = user.isAdmin ? 'descriptionAdmin' : user.isEditor ? 'descriptionEditor' : 'description'

  return (
    <PageHeaderContainer className={cn('flex flex-col sm:gap-5', className)} {...props}>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="flex items-center gap-2">
          <PageHeaderSidebarTrigger />
          <PageHeaderBreadcrumb descriptionKey={descriptionKey} namespace="Courses" titleKey="courses" />
        </div>
        <div className="flex items-center gap-3 sm:mr-6 sm:-mb-1">
          <CourseListTabsList />
          <CourseListDialog />
        </div>
        <PageHeaderLogo className="hidden sm:block" />
      </div>
      <div className="mb-1 flex w-full flex-wrap justify-between gap-4 sm:mt-2 sm:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CourseListTypeSelect />
          <CourseListGroupSelect />
          <CourseListFilterReset />
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <CourseListLanguageSelect />
          <CourseListSort />
        </div>
      </div>
    </PageHeaderContainer>
  )
}
