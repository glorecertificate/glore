'use client'

import { useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { listMessageHistory } from '@/actions/translations'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { timestampMillis } from '@/db/queries/organization'

import { errorCodeOf, useTranslationError } from './use-translation-error'

type Revision = Extract<Awaited<ReturnType<typeof listMessageHistory>>, { data: unknown }>['data'][number]

export const TranslationHistory = ({
  locale,
  messageKey,
  onUse,
}: {
  locale: string
  messageKey: string
  onUse?: (text: string) => void
}) => {
  const t = useTranslations('Translations.history')
  const translationError = useTranslationError()
  const { dateTime } = useFormatter()
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const [pending, startTransition] = useTransition()

  const load = () =>
    startTransition(async () => {
      const result = await listMessageHistory({ key: messageKey, locale })
      const code = errorCodeOf(result)
      if (code) {
        toast.error(translationError(code))
        return
      }
      if ('data' in result) setRevisions(result.data)
    })

  if (!revisions) {
    return (
      <Button loading={pending} onClick={load} size="sm" type="button" variant="outline">
        <LucideIcon name="history" />
        {t('show')}
      </Button>
    )
  }

  return (
    <section aria-label={t('title')} className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{t('title')}</h4>
      {revisions.length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      <ol className="flex flex-col gap-2">
        {revisions.map(revision => (
          <li className="flex flex-col gap-1 rounded-md border p-2 text-sm" key={revision.id}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{t(`actions.${revision.action}`, { name: revision.actor ?? t('unknownPerson') })}</span>
              <time dateTime={new Date(timestampMillis(revision.createdAt)).toISOString()}>
                {dateTime(new Date(timestampMillis(revision.createdAt)), { dateStyle: 'medium', timeStyle: 'short' })}
              </time>
            </div>
            {revision.value !== null && (
              <p className="line-clamp-3 wrap-break-word whitespace-pre-wrap">{revision.value}</p>
            )}
            {revision.value !== null && onUse && (
              <Button
                className="self-start"
                onClick={() => onUse(revision.value as string)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t('use')}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
