'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { discardDraft, saveTranslation } from '@/actions/legal/manage'
import { LegalPublishDialog } from '@/components/features/legal/legal-publish-dialog'
import { useLegalError } from '@/components/features/legal/use-legal-error'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type LegalDocumentRow, type LegalVersionRow } from '@/db/queries/legal'
import { LOCALE_ITEMS } from '@/lib/i18n'

interface Values {
  body: string
  title: string
}

const EMPTY: Values = { body: '', title: '' }

export const LegalDraftEditor = ({
  canPublish,
  document,
  draft,
}: {
  canPublish: boolean
  document: LegalDocumentRow
  draft: LegalVersionRow
}) => {
  const t = useTranslations('LegalAdmin')
  const router = useRouter()
  const legalError = useLegalError()
  const [pending, startTransition] = useTransition()
  const [discarding, setDiscarding] = useState(false)
  const [locale, setLocale] = useState<string>(LOCALE_ITEMS[0]?.value ?? 'en')
  const saved = (code: string): Values => {
    const row = draft.translations.find(translation => translation.locale === code)
    return row ? { body: row.body, title: row.title } : EMPTY
  }
  const [values, setValues] = useState<Record<string, Values>>(() =>
    Object.fromEntries(LOCALE_ITEMS.map(({ value }) => [value, saved(value)]))
  )
  const isDirty = (code: string) => {
    const own = values[code] ?? EMPTY
    const stored = saved(code)
    return own.title !== stored.title || own.body !== stored.body
  }
  const dirty = LOCALE_ITEMS.some(({ value }) => isDirty(value))

  const update = (code: string, patch: Partial<Values>) => {
    setValues(current => ({ ...current, [code]: { ...(current[code] ?? EMPTY), ...patch } }))
  }

  const handleSave = (code: string) => {
    const own = values[code] ?? EMPTY
    startTransition(async () => {
      const { error } = await saveTranslation({
        body: own.body,
        locale: code as 'en',
        title: own.title,
        versionId: draft.id,
      })
      if (error) {
        toast.error(legalError(error))
        return
      }
      toast.success(t('saved'))
      router.refresh()
    })
  }

  const handleDiscard = () => {
    startTransition(async () => {
      const { error } = await discardDraft({ versionId: draft.id })
      setDiscarding(false)
      if (error) {
        toast.error(legalError(error))
        return
      }
      toast.success(t('discarded'))
      router.refresh()
    })
  }

  return (
    <Card data-testid="legal-draft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('draftTitle', { version: draft.version })}
          <Badge variant="info">{t('status_draft')}</Badge>
        </CardTitle>
        <CardDescription>{t('draftDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs onValueChange={setLocale} value={locale}>
          <TabsList>
            {LOCALE_ITEMS.map(item => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LOCALE_ITEMS.map(item => {
            const own = values[item.value] ?? EMPTY
            const translation = draft.translations.find(row => row.locale === item.value)
            return (
              <TabsContent className="mt-4 space-y-4" key={item.value} value={item.value}>
                <div className="grid gap-2">
                  <Label htmlFor={`legal-title-${item.value}`}>{t('titleLabel')}</Label>
                  <Input
                    disabled={pending}
                    id={`legal-title-${item.value}`}
                    maxLength={200}
                    onChange={event => update(item.value, { title: event.target.value })}
                    value={own.title}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`legal-body-${item.value}`}>{t('bodyLabel')}</Label>
                  <Textarea
                    className="min-h-96 font-mono text-sm"
                    disabled={pending}
                    id={`legal-body-${item.value}`}
                    onChange={event => update(item.value, { body: event.target.value })}
                    value={own.body}
                  />
                </div>
                {translation?.outdated && <p className="text-sm text-warning-text">{t('outdated')}</p>}
                <Button
                  disabled={!isDirty(item.value) || !own.title.trim() || !own.body.trim()}
                  loading={pending}
                  onClick={() => handleSave(item.value)}
                  type="button"
                  variant="outline"
                >
                  {t('save', { language: item.label })}
                </Button>
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          {canPublish ? (
            <LegalPublishDialog disabled={dirty || pending} document={document} draft={draft} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('adminOnly')}</p>
          )}
          {dirty && <p className="text-sm text-muted-foreground">{t('unsaved')}</p>}
          <Button
            className="ml-auto"
            data-testid="legal-discard"
            disabled={pending}
            onClick={() => setDiscarding(true)}
            type="button"
            variant="ghost"
          >
            {t('discard')}
          </Button>
        </div>
      </CardContent>

      <AlertDialog onOpenChange={setDiscarding} open={discarding}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('discardDescription', { version: draft.version })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} variant="destructive">
              {t('discardConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
