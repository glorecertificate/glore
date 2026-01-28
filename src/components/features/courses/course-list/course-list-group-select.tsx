'use client'

import { useCourseList } from '@/components/features/courses/course-list/course-list-context'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'

export const CourseListGroupSelect = () => {
  const { activeGroupItems, activeGroups, groupOptions, groups, t, selectGroups } = useCourseList()

  return (
    <MultiSelect label={t('skillGroup')} onChange={selectGroups} options={groupOptions} value={activeGroups}>
      <MultiSelectTrigger>
        {activeGroupItems.map(item => (
          <MultiSelectBadge
            className="py-1 font-medium text-xs"
            key={item.value}
            label={t('skillGroup').toLowerCase()}
            value={item.value}
          >
            {item.label}
          </MultiSelectBadge>
        ))}
      </MultiSelectTrigger>
      <MultiSelectContent align="start">
        {groups.map(item => (
          <MultiSelectItem key={item.value} {...item} />
        ))}
      </MultiSelectContent>
    </MultiSelect>
  )
}
