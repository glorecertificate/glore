'use client'

import { type Locale, useTranslations } from 'next-intl'

import { useCourseListLanguages } from '@/components/features/courses/course-list/use-params'
import { useI18n } from '@/components/providers/i18n'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { LOCALES } from '@/lib/i18n'

export const CourseListLanguageSelect = () => {
  const { localeItems } = useI18n()
  const t = useTranslations('Courses')
  const { activeLanguages, setActiveLanguages } = useCourseListLanguages()

  const activeLanguageItems = localeItems.filter(item => activeLanguages.includes(item.value))

  return (
    <MultiSelect
      label={t('language')}
      min={1}
      onChange={(languages: string[]) => setActiveLanguages(languages as Locale[])}
      options={LOCALES}
      value={activeLanguages}
    >
      <MultiSelectTrigger position="start">
        {activeLanguageItems.map(({ displayLabel, icon, value }) => (
          <MultiSelectBadge
            className="h-5 gap-0 rounded-xl bg-muted/80 py-0 text-sm"
            key={value}
            label={displayLabel}
            value={value}
          >
            {icon && <span className="mr-1">{icon}</span>}
          </MultiSelectBadge>
        ))}
      </MultiSelectTrigger>
      <MultiSelectContent align="start">
        {localeItems.map(({ label, icon, value }) => (
          <MultiSelectItem key={value} value={value}>
            {label} {icon}
          </MultiSelectItem>
        ))}
      </MultiSelectContent>
    </MultiSelect>
  )
}
