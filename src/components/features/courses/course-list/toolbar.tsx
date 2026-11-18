'use client'

import { useTranslations } from 'next-intl'

import { CourseListLanguageSelect } from '@/components/features/courses/course-list/language-select'
import { CourseListGroupSelect } from '@/components/features/courses/course-list/skill-group-select'
import { CourseListSort } from '@/components/features/courses/course-list/sort'
import { CourseListTypeSelect } from '@/components/features/courses/course-list/type-select'
import { useCourseListFilters } from '@/components/features/courses/course-list/use-params'
import { FilterBar } from '@/components/ui/filter-bar'
import { SearchInput } from '@/components/ui/search'
import { SHORTCUTS } from '@/lib/shortcuts'

export const CourseListToolbar = () => {
  const t = useTranslations('CourseList')
  const { filterCount, hasFilters, resetFilters } = useCourseListFilters()

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <FilterBar
        active={hasFilters}
        count={filterCount}
        onClear={resetFilters}
        search={
          <SearchInput
            className="w-full sm:w-72"
            hotkey={SHORTCUTS.filter.key}
            placeholder={t('searchPlaceholder')}
            urlKey="q"
          />
        }
      >
        <CourseListLanguageSelect />
        <CourseListTypeSelect />
        <CourseListGroupSelect />
        <CourseListSort className="sm:ml-auto" />
      </FilterBar>
    </div>
  )
}
