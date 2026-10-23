'use client'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { TranslationBadge } from '@/components/features/translations/badge'
import { TranslationPanel } from '@/components/features/translations/panel'
import { useContentTranslations } from '@/components/features/translations/use-content-translations'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { summarizeLocale } from '@/db/queries/content-translation'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export const CourseTranslation = () => {
  const t = useTranslations('ContentTranslation')
  const { course, hasAnyUpdates, language, saveVersion } = useCourse()
  const translations = useContentTranslations('course', course.id, saveVersion)

  if (language === DEFAULT_LOCALE) return null

  const summary = translations.items ? summarizeLocale(translations.items, language) : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label={t('title')} className="gap-1.5" size="xs" variant="outline">
          <LucideIcon className="size-4" name="languages" />
          {summary && <TranslationBadge state={summary.state} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <TranslationPanel
          disabled={hasAnyUpdates}
          entityId={course.id}
          entityType="course"
          locale={language}
          onTranslated={() => window.location.reload()}
          translations={translations}
        />
      </PopoverContent>
    </Popover>
  )
}
