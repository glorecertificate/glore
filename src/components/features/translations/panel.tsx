'use client'

import { useState } from 'react'

import { type Locale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { translateEntity } from '@/actions/translations/ai'
import { reviewTranslation } from '@/actions/translations/states'
import { TranslationBadge } from '@/components/features/translations/badge'
import { type ContentTranslations } from '@/components/features/translations/use-content-translations'
import { useI18n } from '@/components/providers/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { type ContentEntityType, countStates, localeStates, summarizeLocale } from '@/db/queries/content-translation'
import { cn } from '@/lib/utils'

export interface TranslatedField {
  column: string
  id: number
  table: string
  value: unknown
}

type Busy = 'review' | 'translate' | null

const ERROR_KEYS = {
  AI_INVALID: 'aiInvalid',
  EMPTY: 'empty',
  EXISTS: 'exists',
  FORBIDDEN: 'forbidden',
  RATE_LIMITED: 'rateLimited',
  ai_not_configured: 'aiNotConfigured',
  ai_unavailable: 'aiUnavailable',
} as const

const REPLACEABLE = new Set(['machine', 'missing'])

export const TranslationPanel = ({
  className,
  disabled,
  entityId,
  entityType,
  locale,
  onTranslated,
  translations,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  disabled?: boolean
  entityId: number
  entityType: ContentEntityType
  locale: Locale
  onTranslated?: (fields: TranslatedField[]) => void
  translations: ContentTranslations
}) => {
  const t = useTranslations('ContentTranslation')
  const { localeItems } = useI18n()
  const [busy, setBusy] = useState<Busy>(null)
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { items, refresh } = translations
  const summary = items ? summarizeLocale(items, locale) : null
  const counts = items ? countStates(localeStates(items, locale)) : null
  const language = localeItems.find(({ value }) => value === locale)?.label ?? locale
  const total = items?.length ?? 0
  const needsConfirm = !!summary && summary.hasContent && !REPLACEABLE.has(summary.state)
  const locked = disabled || !items || busy !== null

  const errorMessage = (code: string | undefined) => {
    const key = ERROR_KEYS[code as keyof typeof ERROR_KEYS]
    return key ? t(`errors.${key}`) : t('errors.generic')
  }

  const runTranslation = async (overwrite: boolean) => {
    if (!items) return
    setBusy('translate')
    setProgress(0)
    const fields: TranslatedField[] = []
    let failed = false
    for (const item of items) {
      const result = await translateEntity({ entityId: item.entityId, entityType: item.entityType, locale, overwrite })
      if ('error' in result) {
        toast.error(errorMessage(result.error.code))
        failed = true
        break
      }
      fields.push(...result.data.fields)
      setProgress(count => count + 1)
    }
    setBusy(null)
    refresh()
    if (failed) return
    toast.success(t('translated', { language }))
    onTranslated?.(fields)
  }

  const handleReview = async () => {
    setBusy('review')
    const result = await reviewTranslation({ entityId, entityType, locale })
    setBusy(null)
    if ('error' in result) {
      toast.error(errorMessage(result.error.code))
      return
    }
    refresh()
    toast.success(t('reviewed', { language }))
  }

  return (
    <div className={cn('flex flex-col gap-3', className)} data-slot="translation-panel" {...props}>
      <div className="flex flex-wrap items-center gap-2">
        {summary && <TranslationBadge state={summary.state} />}
        {counts && counts.total > 1 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('counts', { reviewed: counts.reviewed, total: counts.total })}
          </span>
        )}
      </div>
      {summary && <p className="text-xs text-muted-foreground">{t(`hints.${summary.state}`, { language })}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={locked}
          icon="sparkles"
          loading={busy === 'translate'}
          onClick={() => (needsConfirm ? setConfirmOpen(true) : runTranslation(false))}
          size="sm"
          type="button"
          variant="outline"
        >
          {busy === 'translate' ? t('translating', { done: progress, total }) : t('translate')}
        </Button>
        <Button
          disabled={locked || !summary?.hasContent || summary.state === 'reviewed'}
          icon="badge-check"
          loading={busy === 'review'}
          onClick={handleReview}
          size="sm"
          type="button"
          variant="outline"
        >
          {t('markReviewed')}
        </Button>
      </div>
      {disabled && <p className="text-xs text-warning-text">{t('saveFirst')}</p>}
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('replaceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('replaceMessage', { language })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => runTranslation(true)} variant="brand">
              {t('replace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
