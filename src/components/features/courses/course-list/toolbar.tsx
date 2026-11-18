'use client'

import { useTranslations } from 'next-intl'

import { CourseListDialog } from '@/components/features/courses/course-list/dialog'
import { CourseListFrameworkLink } from '@/components/features/courses/course-list/framework-link'
import { CourseListLanguageSelect } from '@/components/features/courses/course-list/language-select'
import { CourseListGroupSelect } from '@/components/features/courses/course-list/skill-group-select'
import { CourseListSort } from '@/components/features/courses/course-list/sort'
import { CourseListTabsList } from '@/components/features/courses/course-list/tabs'
import { CourseListTypeSelect } from '@/components/features/courses/course-list/type-select'
import { useCourseListFilters } from '@/components/features/courses/course-list/use-params'
import { useSession } from '@/components/providers/session'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search'
import { SHORTCUTS } from '@/lib/shortcuts'
import settings from '~/config/app.json'

export const CourseListToolbar = () => {
  const { user } = useSession()
  const t = useTranslations('CourseList')
  const { hasFilters, resetFilters } = useCourseListFilters()
  const description = t(user.isAdmin ? 'descriptionAdmin' : user.isEditor ? 'descriptionEditor' : 'description', {
    minSkills: settings.minSkills,
  })

  return (
    <div className="mb-6 flex flex-col gap-4">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderDescription>{description}</PageHeaderDescription>
        </PageHeaderHeading>
        {user.canEdit && (
          <PageHeaderActions>
            <CourseListFrameworkLink />
            <CourseListDialog />
          </PageHeaderActions>
        )}
      </PageHeader>
      <CourseListTabsList />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <FilterBar active={hasFilters} onClear={resetFilters}>
          <SearchInput
            className="w-full sm:w-72"
            hotkey={SHORTCUTS.filter.key}
            placeholder={t('searchPlaceholder')}
            urlKey="q"
          />
          <CourseListLanguageSelect />
          <CourseListTypeSelect />
          <CourseListGroupSelect />
        </FilterBar>
        <div className="flex shrink-0">
          <CourseListSort />
        </div>
      </div>
    </div>
  )
}
