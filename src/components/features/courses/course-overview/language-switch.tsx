'use client'

import { startTransition } from 'react'

import { useTranslations } from 'next-intl'

import { setCourseLanguage } from '@/actions/courses/progress'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
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
  ...props
}: React.ComponentProps<'nav'> &
  Pick<CourseOverview, 'language' | 'languages' | 'slug'> & {
    courseId?: number
    lessonId?: number
    persist?: boolean
  }) => {
  const t = useTranslations('Learning.overview')
  const { localeItems } = useI18n()

  if (languages.length < 2) return null

  const available = new Set(languages)
  const items = []
  for (const { displayLabel, icon, value } of localeItems) {
    if (!available.has(value)) continue
    items.push(
      <Button
        aria-current={value === language ? 'true' : undefined}
        asChild
        key={value}
        size="sm"
        variant={value === language ? 'secondary' : 'outline'}
      >
        <Link
          href={lessonId ? `/courses/${slug}/learn?lang=${value}&lesson=${lessonId}` : `/courses/${slug}?lang=${value}`}
          onClick={() => {
            if (persist && courseId) startTransition(() => void setCourseLanguage(courseId, value))
          }}
          replace
          scroll={false}
        >
          <span aria-hidden className="flex h-3 items-center">
            {icon}
          </span>
          {displayLabel}
        </Link>
      </Button>
    )
  }

  return (
    <nav aria-label={t('languageLabel')} className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      {items}
    </nav>
  )
}
