'use client'

import { memo, useMemo } from 'react'

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

export const CourseListHeader = memo(({ className, ...props }: React.ComponentProps<typeof PageHeaderContainer>) => {
  const { user } = useSession()
  const descriptionKey = useMemo(
    () => (user.is_admin ? 'descriptionAdmin' : user.is_editor ? 'descriptionEditor' : 'description'),
    [user.is_admin, user.is_editor]
  )

  return (
    <PageHeaderContainer className={cn('flex flex-col gap-3', className)} {...props}>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PageHeaderSidebarTrigger />
          <PageHeaderBreadcrumb descriptionKey={descriptionKey} namespace="Courses" titleKey="courses" />
        </div>
        <div className="mr-6 flex items-center gap-3">
          <CourseListTabsList />
          <CourseListDialog />
        </div>
        <PageHeaderLogo />
      </div>
      <div className="mt-2 mb-1 flex w-full justify-between gap-2">
        <div className="flex items-center gap-2">
          <CourseListLanguageSelect />
          <CourseListTypeSelect />
          <CourseListGroupSelect />
          <CourseListFilterReset />
        </div>
        <CourseListSort />
      </div>
    </PageHeaderContainer>
  )
})
