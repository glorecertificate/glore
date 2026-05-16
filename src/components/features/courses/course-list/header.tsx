'use client'

import { useTranslations } from 'next-intl'

import { CourseListDialog } from '@/components/features/courses/course-list/dialog'
import { CourseListFilterReset } from '@/components/features/courses/course-list/filter-reset'
import { CourseListLanguageSelect } from '@/components/features/courses/course-list/language-select'
import { CourseListGroupSelect } from '@/components/features/courses/course-list/skill-group-select'
import { CourseListSort } from '@/components/features/courses/course-list/sort'
import { CourseListTabsList } from '@/components/features/courses/course-list/tabs'
import { CourseListTypeSelect } from '@/components/features/courses/course-list/type-select'
import { Header, HeaderBreadcrumb, HeaderLogo, HeaderTrigger } from '@/components/ui/header'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const CourseListHeader = ({ className, ...props }: React.ComponentProps<typeof Header>) => {
  const t = useTranslations('Courses')
  const { user } = useSession()
  const description = t(user.isAdmin ? 'descriptionAdmin' : user.isEditor ? 'descriptionEditor' : 'description')

  return (
    <Header className={cn('flex flex-col sm:gap-3', className)} {...props}>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="flex items-center gap-2">
          <HeaderTrigger />
          <HeaderBreadcrumb description={description} title={t('courses')} />
        </div>
        <div className="flex items-center gap-3 sm:mr-6 sm:-mb-1">
          <CourseListTabsList />
          <CourseListDialog />
        </div>
        <HeaderLogo href="/courses" className="hidden sm:block" />
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
    </Header>
  )
}
