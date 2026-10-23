'use client'

import { useId, useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { discardMessageDraft, publishMessage, resetMessage, saveMessageDraft } from '@/actions/messages'
import { suggestMessage } from '@/actions/translations'
import { LucideIcon } from '@/components/icons/lucide'
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
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { placeholdersOf } from '@/lib/message-preview'
import { validateOverride } from '@/lib/message-validation'
import { type TranslationCell, editableText } from '@/lib/translation-table'

import { TranslationHistory } from './translation-history'
import { TranslationPreview } from './translation-preview'
import { errorCodeOf, useTranslationError } from './use-translation-error'

type Action = 'discard' | 'publish' | 'reset' | 'save' | 'suggest'

const validationOf = (key: string, source: string | null, text: string) => {
  if (source === null) return 'orphaned' as const
  if (!text.trim()) return 'empty' as const
  const result = validateOverride({ en: { [key]: source }, key, precompiled: true, value: text })
  return result.ok ? ('valid' as const) : result.reason
}

export const LocaleEditor = ({
  canEdit,
  cell,
  isAdmin,
  label,
  locale,
  messageKey,
  onChanged,
  source,
}: {
  canEdit: boolean
  cell: TranslationCell
  isAdmin: boolean
  label: string
  locale: string
  messageKey: string
  onChanged: () => Promise<void>
  source: string | null
}) => {
  const t = useTranslations('Translations.editor')
  const translationError = useTranslationError()
  const id = useId()
  const [text, setText] = useState(() => editableText(cell))
  const [action, setAction] = useState<Action | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pending, startTransition] = useTransition()

  const initial = editableText(cell)
  const dirty = text !== initial
  const status = validationOf(messageKey, source, text)
  const valid = status === 'valid'
  const hasOverride = cell.published !== null || cell.draft !== null
  const orphaned = cell.stale === 'orphaned'
  const canDelete = hasOverride && (!orphaned || isAdmin)
  const canSuggest = canEdit && locale !== DEFAULT_LOCALE && source !== null
  const placeholders = source === null ? [] : placeholdersOf(source)

  const run = (name: Action, work: () => Promise<object>, success: string) => {
    setAction(name)
    startTransition(async () => {
      const result = await work()
      const code = errorCodeOf(result)
      if (code) {
        toast.error(translationError(code))
        return
      }
      await onChanged()
      toast.success(success)
    })
  }

  const handleSave = () =>
    run('save', () => saveMessageDraft({ key: messageKey, locale, value: text }), t('toasts.saved'))

  const handlePublish = () =>
    run(
      'publish',
      async () => {
        if (dirty) {
          const saved = await saveMessageDraft({ key: messageKey, locale, value: text })
          if (errorCodeOf(saved)) return saved
        }
        return await publishMessage({ key: messageKey, locale })
      },
      t('toasts.published')
    )

  const handleDiscard = () =>
    run('discard', () => discardMessageDraft({ key: messageKey, locale }), t('toasts.discarded'))

  const handleReset = () => {
    setConfirmReset(false)
    run('reset', () => resetMessage({ key: messageKey, locale }), t('toasts.reset'))
  }

  const handleSuggest = () => run('suggest', () => suggestMessage({ key: messageKey, locale }), t('toasts.suggested'))

  return (
    <div className="flex flex-col gap-4">
      {cell.stale && cell.stale !== 'redundant' && (
        <Banner role="alert" variant={cell.stale === 'outdated' ? 'warning' : 'destructive'}>
          <LucideIcon className="mt-0.5 size-4 shrink-0" name="triangle-alert" />
          <p>{t(`stale.${cell.stale}`)}</p>
        </Banner>
      )}
      {cell.stale === 'redundant' && (
        <Banner>
          <LucideIcon className="mt-0.5 size-4 shrink-0" name="info" />
          <p>{t('stale.redundant')}</p>
        </Banner>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-text`}>{t('textLabel', { language: label })}</Label>
        <Textarea
          aria-describedby={`${id}-status`}
          aria-invalid={!valid && dirty}
          className="min-h-28 font-mono text-sm"
          disabled={!canEdit || orphaned || pending}
          id={`${id}-text`}
          lang={locale}
          onChange={event => setText(event.target.value)}
          value={text}
        />
        <p
          className={valid ? 'text-xs text-success-text' : 'text-xs text-destructive-text'}
          data-status={status}
          id={`${id}-status`}
          role={valid ? 'status' : 'alert'}
        >
          {t(`validation.${status}`)}
        </p>
        {placeholders.length > 0 && (
          <p className="text-xs text-muted-foreground">{t('placeholders', { list: placeholders.join(' ') })}</p>
        )}
      </div>
      {valid && source !== null && <TranslationPreview locale={locale} source={source} value={text} />}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!valid || !dirty || pending}
            loading={pending && action === 'save'}
            onClick={handleSave}
            type="button"
            variant="outline"
          >
            <LucideIcon name="save" />
            {t('save')}
          </Button>
          <Button
            disabled={!valid || !(dirty || cell.draft !== null) || pending}
            loading={pending && action === 'publish'}
            onClick={handlePublish}
            type="button"
            variant="brand"
          >
            <LucideIcon name="send" />
            {t('publish')}
          </Button>
          {cell.draft !== null && (
            <Button
              disabled={pending}
              loading={pending && action === 'discard'}
              onClick={handleDiscard}
              type="button"
              variant="ghost"
            >
              <LucideIcon name="undo-2" />
              {t('discard')}
            </Button>
          )}
          {canSuggest && (
            <Button
              disabled={pending}
              loading={pending && action === 'suggest'}
              loadingText={t('suggesting')}
              onClick={handleSuggest}
              type="button"
              variant="outline"
            >
              <LucideIcon name="sparkles" />
              {t('suggest')}
            </Button>
          )}
          {canDelete && (
            <Button
              disabled={pending}
              loading={pending && action === 'reset'}
              onClick={() => setConfirmReset(true)}
              type="button"
              variant="ghost"
            >
              <LucideIcon name="rotate-ccw" />
              {orphaned ? t('delete') : t('reset')}
            </Button>
          )}
        </div>
      )}
      <TranslationHistory locale={locale} messageKey={messageKey} onUse={canEdit ? setText : undefined} />
      <AlertDialog onOpenChange={setConfirmReset} open={confirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{orphaned ? t('deleteTitle') : t('resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {orphaned ? t('deleteDescription') : t('resetDescription', { language: label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} variant="destructive">
              {orphaned ? t('delete') : t('confirmReset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
