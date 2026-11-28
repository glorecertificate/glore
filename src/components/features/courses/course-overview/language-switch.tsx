'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { setCourseLanguage } from '@/actions/courses/progress'
import { useI18n } from '@/components/providers/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const CourseLanguageSwitch = ({
  className,
  courseId,
  language,
  languages,
  lessonId,
  persist = false,
  slug,
}: {
  className?: string
  courseId?: number
  lessonId?: number
  persist?: boolean
} & Pick<CourseOverview, 'language' | 'languages' | 'slug'>) => {
  const t = useTranslations('Learning.overview')
  const { replace } = useRouter()
  const { localeItems } = useI18n()

  if (languages.length < 2) return null

  const available = new Set(languages)
  const items = localeItems.filter(({ value }) => available.has(value))
  const active = items.find(({ value }) => value === language) ?? items[0]

  const onChange = (value: Locale) => {
    if (persist && courseId) startTransition(() => void setCourseLanguage(courseId, value))
    replace(lessonId ? `/courses/${slug}/learn?lang=${value}&lesson=${lessonId}` : `/courses/${slug}?lang=${value}`, {
      scroll: false,
    })
  }

  return (
    <Select onValueChange={onChange} value={active?.value}>
      <SelectTrigger aria-label={t('languageLabel')} className={cn('w-full sm:w-auto', className)}>
        <span className="flex! items-center gap-2">
          <span aria-hidden className="flex h-3 items-center">
            {active?.icon}
          </span>
          {active?.label}
        </span>
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {items.map(item => (
          <SelectItem key={item.value} value={item.value}>
            <span className="flex items-center gap-2">
              <span aria-hidden className="flex h-3 items-center">
                {item.icon}
              </span>
              {item.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
