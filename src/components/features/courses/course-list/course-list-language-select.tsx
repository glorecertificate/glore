'use client'

import { useCourseList } from '@/components/features/courses/course-list/course-list-context'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { i18n } from '@/lib/i18n'

export const CourseListLanguageSelect = () => {
  const { activeLanguageItems, activeLanguages, localeItems, t, selectLanguages } = useCourseList()

  return (
    <MultiSelect label={t('language')} onChange={selectLanguages} options={i18n.locales} value={activeLanguages}>
      <MultiSelectTrigger>
        {activeLanguageItems.map(({ displayLabel, icon, label, ...item }) => (
          <MultiSelectBadge className="gap-0 py-0 text-sm" key={item.value} label={displayLabel} {...item}>
            {icon && <span className="mr-1 inline-block">{icon}</span>}
          </MultiSelectBadge>
        ))}
      </MultiSelectTrigger>
      <MultiSelectContent align="end">
        {localeItems.map(({ label, icon, value }) => (
          <MultiSelectItem key={value} value={value}>
            {label} {icon}
          </MultiSelectItem>
        ))}
      </MultiSelectContent>
    </MultiSelect>
  )
}
