'use client'

import { type Locale, useTranslations } from 'next-intl'

import { TranslationBadge } from '@/components/features/translations/badge'
import { TranslationPanel } from '@/components/features/translations/panel'
import { useContentTranslations } from '@/components/features/translations/use-content-translations'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type ContentEntityType, summarizeLocale } from '@/db/queries/content-translation'
import { DEFAULT_LOCALE } from '@/lib/i18n'

interface TranslationPopoverProps {
  disabled: boolean
  entityId: number | null
  entityType: ContentEntityType
  locale: Locale
  version?: number
}

export const TranslationPopover = ({ disabled, entityId, entityType, locale, version }: TranslationPopoverProps) => {
  const t = useTranslations('ContentTranslation')
  const translations = useContentTranslations(entityType, entityId, version)

  if (locale === DEFAULT_LOCALE || entityId === null) return null

  const summary = translations.items ? summarizeLocale(translations.items, locale) : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label={t('title')} className="gap-1.5" variant="outline">
          <LucideIcon name="languages" />
          {summary && <TranslationBadge state={summary.state} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <TranslationPanel
          disabled={disabled}
          entityId={entityId}
          entityType={entityType}
          locale={locale}
          onTranslated={() => window.location.reload()}
          translations={translations}
        />
      </PopoverContent>
    </Popover>
  )
}
