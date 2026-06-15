'use client'

import { useTranslations } from 'next-intl'

import { CourseListDialog } from '@/components/features/courses/course-list/dialog'
import { CourseListFilterReset } from '@/components/features/courses/course-list/filter-reset'
import { CourseListLanguageSelect } from '@/components/features/courses/course-list/language-select'
import { CourseListGroupSelect } from '@/components/features/courses/course-list/skill-group-select'
import { CourseListSort } from '@/components/features/courses/course-list/sort'
import { CourseListTabsList } from '@/components/features/courses/course-list/tabs'
import { CourseListTypeSelect } from '@/components/features/courses/course-list/type-select'
import { useSession } from '@/components/providers/session'
import { Header, HeaderBreadcrumb, HeaderTrigger } from '@/components/ui/header'
import { SearchInput } from '@/components/ui/search'
import { cn } from '@/lib/utils'

export const CourseListHeader = ({ className, ...props }: React.ComponentProps<typeof Header>) => {
  const { user } = useSession()
  const t = useTranslations('Courses')
  const description = t(user.isAdmin ? 'descriptionAdmin' : user.isEditor ? 'descriptionEditor' : 'description')

  return (
    <Header className={cn('flex flex-col sm:gap-3.5', className)} {...props}>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="flex items-center gap-2.5">
          <HeaderTrigger />
          <HeaderBreadcrumb description={description} title={t('courses')} />
        </div>
        <div className="flex items-center gap-3">
          <CourseListDialog />
          <CourseListTabsList />
        </div>
      </div>
      <div className="mb-1 flex w-full flex-wrap justify-between gap-4 sm:mt-1.5 sm:gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput className="h-9 w-80" hotkey="/" placeholder={t('searchPlaceholder')} urlKey="q" />
            <CourseListLanguageSelect />
            <CourseListTypeSelect />
            <CourseListGroupSelect />
          </div>
          <CourseListFilterReset />
        </div>
        <CourseListSort />
      </div>
    </Header>
  )
}
