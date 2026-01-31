'use client'

import { memo, useCallback } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useCourseListLanguages } from '@/components/features/courses/list/use-params'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { useI18n } from '@/hooks/use-i18n'
import { i18n } from '@/lib/i18n'

export const CourseListLanguageSelect = memo(() => {
  const { localeItems } = useI18n()
  const t = useTranslations('Courses')
  const { activeLanguages, setActiveLanguages } = useCourseListLanguages()

  const activeLanguageItems = localeItems.filter(item => activeLanguages.includes(item.value))

  const handleChange = useCallback(
    (languages: string[]) => setActiveLanguages(languages as Locale[]),
    [setActiveLanguages]
  )

  return (
    <MultiSelect label={t('language')} min={1} onChange={handleChange} options={i18n.locales} value={activeLanguages}>
      <MultiSelectTrigger position="start">
        {activeLanguageItems.map(({ displayLabel, icon, value }) => (
          <MultiSelectBadge className="gap-0 py-0 text-sm" key={value} label={displayLabel} value={value}>
            {icon && <span className="mr-1 inline-block">{icon}</span>}
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
})
