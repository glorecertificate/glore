'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { discardDraft, saveTranslation } from '@/actions/legal/manage'
import { AskAIProvider } from '@/components/features/courses/course-editor/ask-ai-provider'
import { EditorActions } from '@/components/features/courses/course-editor/editor-actions'
import { LegalBody } from '@/components/features/legal/legal-body'
import { LegalPublishDialog } from '@/components/features/legal/legal-publish-dialog'
import {
  LEGAL_FIELDS,
  type LegalField,
  type LegalValues,
  legalSources,
  legalValueOf,
  parseLegalFieldKey,
  planLegalTranslation,
} from '@/components/features/legal/legal-translation-fields'
import { useLegalError } from '@/components/features/legal/use-legal-error'
import { FieldTranslateButton } from '@/components/features/translations/field-translate-button'
import { TranslateMenu } from '@/components/features/translations/translate-menu'
import { type TranslatedField } from '@/components/features/translations/use-translate'
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
import { toast } from '@/components/ui/toast'
import { type LegalDocumentRow, type LegalVersionRow } from '@/db/queries/legal'
import { LOCALE_ITEMS } from '@/lib/i18n'
import { hasText } from '@/lib/translate'

type Values = LegalValues

const EMPTY: Values = { body: '', title: '' }
const LOCALE_CODES = LOCALE_ITEMS.map(({ value }) => value)

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
  const [bodyVersion, setBodyVersion] = useState(0)
  const [titleBusy, setTitleBusy] = useState(false)
  const valuesRef = useRef(values)
  const flushRef = useRef<(() => unknown) | null>(null)
  const isDirty = (code: string) => {
    const own = values[code] ?? EMPTY
    const stored = saved(code)
    return own.title !== stored.title || own.body !== stored.body
  }
  const dirty = LOCALE_ITEMS.some(({ value }) => isDirty(value))

  const update = (code: string, patch: Partial<Values>) => {
    valuesRef.current = { ...valuesRef.current, [code]: { ...(valuesRef.current[code] ?? EMPTY), ...patch } }
    setValues(valuesRef.current)
  }

  const applyTranslated = (event: TranslatedField, seen: ReadonlyMap<string, string>) => {
    const field = parseLegalFieldKey(event.key)
    if (!field) return
    if (field === 'body') flushRef.current?.()
    const current = valuesRef.current[event.locale]?.[field] ?? ''
    if (hasText(current) && current !== seen.get(event.key)) return
    update(event.locale, { [field]: legalValueOf(field, event.value) })
    if (field === 'body') setBodyVersion(version => version + 1)
  }

  const planFor = (code: string, source: string, fields: LegalField[]) =>
    planLegalTranslation({ fields, source, target: code, values: valuesRef.current })

  const flushBody = () => flushRef.current?.()

  const handleSave = (code: string) => {
    startTransition(async () => {
      await flushRef.current?.()
      const own = valuesRef.current[code] ?? EMPTY
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
      <CardContent className="min-w-0 space-y-6">
        <AskAIProvider>
          <Tabs onValueChange={setLocale} value={locale}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList className="max-sm:w-full">
                {LOCALE_ITEMS.map(item => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <EditorActions>
                <TranslateMenu
                  beforeRun={flushBody}
                  empty={t('translateEmpty')}
                  onApply={applyTranslated}
                  plan={source => planFor(locale, source, LEGAL_FIELDS)}
                  sources={legalSources(values, LEGAL_FIELDS, LOCALE_CODES, locale)}
                  target={locale}
                />
              </EditorActions>
            </div>
            {LOCALE_ITEMS.map(item => {
              const own = values[item.value] ?? EMPTY
              const translation = draft.translations.find(row => row.locale === item.value)
              return (
                <TabsContent className="mt-4 min-w-0 space-y-4" key={item.value} value={item.value}>
                  <div className="grid gap-2">
                    <Label htmlFor={`legal-title-${item.value}`}>{t('titleLabel')}</Label>
                    <div className="group/field flex items-center gap-2">
                      <Input
                        aria-busy={titleBusy}
                        disabled={pending}
                        id={`legal-title-${item.value}`}
                        maxLength={200}
                        onChange={event => update(item.value, { title: event.target.value })}
                        readOnly={titleBusy}
                        value={own.title}
                      />
                      <FieldTranslateButton
                        beforeRun={flushBody}
                        onApply={applyTranslated}
                        onRunningChange={setTitleBusy}
                        plan={source => planFor(item.value, source, ['title'])}
                        sources={legalSources(values, ['title'], LOCALE_CODES, item.value)}
                        target={item.value}
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-sm leading-none font-medium" id={`legal-body-${item.value}`}>
                      {t('bodyLabel')}
                    </p>
                    <LegalBody
                      flushRef={flushRef}
                      key={`${item.value}-${bodyVersion}`}
                      labelledBy={`legal-body-${item.value}`}
                      markdown={own.body}
                      onChange={body => update(item.value, { body })}
                      version={`${item.value}-${bodyVersion}`}
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
        </AskAIProvider>

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
