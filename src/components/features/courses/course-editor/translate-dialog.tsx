'use client'

import { useRef, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import {
  fillKey,
  listEditorFields,
  planTranslation,
  readLocale,
} from '@/components/features/courses/course-editor/translation-fields'
import { useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { hasText } from '@/lib/translate'

const ERROR_KEYS = {
  FORBIDDEN: 'forbidden',
  RATE_LIMITED: 'rateLimited',
  ai_not_configured: 'notConfigured',
  ai_unavailable: 'unavailable',
} as const

interface TranslateDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const TranslateDialog = ({ onOpenChange, open }: TranslateDialogProps) => {
  const t = useTranslations('CourseTranslate')
  const { localeItems } = useI18n()
  const { applyTranslated, course, language } = useCourse()
  const [source, setSource] = useState<Locale | null>(null)
  const [picked, setPicked] = useState<Locale[] | null>(null)
  const [mode, setMode] = useState<'fill' | 'replace'>('fill')
  const [completed, setCompleted] = useState<Record<string, number>>({})
  const [runTotals, setRunTotals] = useState<Record<string, number>>({})
  const seen = useRef<ReadonlyMap<string, unknown>>(new Map())
  const applied = useRef(new Set<string>())
  const lastRun = useRef<{ replace: boolean; source: Locale; targets: Locale[] } | null>(null)
  const translate = useTranslate({
    onField: field => {
      applyTranslated(field, seen.current)
      applied.current.add(fillKey(field.locale, field.key))
      setCompleted(current => ({ ...current, [field.locale]: (current[field.locale] ?? 0) + 1 }))
    },
  })

  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale
  const running = translate.status === 'running'
  const started = translate.status !== 'idle'
  const appliedCount = Object.values(completed).reduce((sum, count) => sum + count, 0)
  const replace = mode === 'replace'
  const fields = open ? listEditorFields(course) : []
  const filled = LOCALES.filter(locale => fields.some(field => hasText(readLocale(field, course, locale))))
  const preferred = filled.includes(language) ? language : DEFAULT_LOCALE
  const activeSource = source && filled.includes(source) ? source : filled.includes(preferred) ? preferred : filled[0]
  const others = LOCALES.filter(locale => locale !== activeSource)
  const chosen = (picked ?? others).filter(locale => locale !== activeSource)
  const plan = open && activeSource ? planTranslation({ course, replace, source: activeSource, targets: chosen }) : null
  const writes = (locale: string) => {
    const counts = plan?.summary[locale]
    return counts ? counts.fill + counts.replace : 0
  }
  const total = chosen.reduce((sum, locale) => sum + writes(locale), 0)
  const canRun = !!activeSource && !running && total > 0
  const canRetry = !running && (translate.failures.length > 0 || translate.status === 'error')
  const errorKey = translate.error ? (ERROR_KEYS[translate.error as keyof typeof ERROR_KEYS] ?? 'generic') : null

  const toggleTarget = (locale: Locale, checked: boolean) =>
    setPicked(chosen.filter(item => item !== locale).concat(checked ? [locale] : []))

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      translate.reset()
      setCompleted({})
      setRunTotals({})
      applied.current = new Set()
    }
    onOpenChange(next)
  }

  const run = async () => {
    if (!plan || !activeSource) return
    seen.current = plan.seen
    applied.current = new Set()
    lastRun.current = { replace, source: activeSource, targets: chosen }
    setCompleted({})
    setRunTotals(Object.fromEntries(chosen.map(locale => [locale, writes(locale)])))
    await translate.run({ fields: plan.fields, replace, source: activeSource, targets: chosen })
  }

  const retry = async () => {
    const previous = lastRun.current
    if (!previous) return
    const next = planTranslation({
      course,
      replace: previous.replace,
      source: previous.source,
      targets: previous.targets,
    })
    seen.current = next.seen
    const request = next.fields.map(field => ({
      ...field,
      existing: Object.fromEntries(
        previous.targets.map(locale => [
          locale,
          applied.current.has(fillKey(locale, field.key)) || (!!field.existing[locale] && !previous.replace),
        ])
      ),
    }))
    setCompleted({})
    setRunTotals(
      Object.fromEntries(
        previous.targets.map(locale => [locale, request.filter(field => !field.existing[locale]).length])
      )
    )
    await translate.run({ fields: request, replace: false, source: previous.source, targets: previous.targets })
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {!activeSource && <p className="text-sm text-muted-foreground">{t('noFilled')}</p>}
          {activeSource && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="translate-source">{t('source')}</Label>
              <Select
                disabled={running}
                onValueChange={value => {
                  setSource(value as Locale)
                  setPicked(null)
                }}
                value={activeSource}
              >
                <SelectTrigger className="w-full sm:w-64" id="translate-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filled.map(locale => (
                    <SelectItem key={locale} value={locale}>
                      {nameOf(locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <fieldset className="flex flex-col gap-2" disabled={running}>
            <legend className="mb-1 text-sm font-medium">{t('targets')}</legend>
            {others.map(locale => (
              <div className="flex flex-col gap-0.5" key={locale}>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={chosen.includes(locale)}
                    onCheckedChange={checked => toggleTarget(locale, checked === true)}
                  />
                  {nameOf(locale)}
                </label>
                {chosen.includes(locale) && plan?.summary[locale] && (
                  <p className="pl-6 text-xs text-muted-foreground">
                    {replace
                      ? t('summaryReplace', { fill: plan.summary[locale].fill, replace: plan.summary[locale].replace })
                      : t('summaryFill', { fill: plan.summary[locale].fill, keep: plan.summary[locale].keep })}
                  </p>
                )}
              </div>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2" disabled={running}>
            <legend className="mb-1 text-sm font-medium">{t('mode')}</legend>
            <RadioGroup onValueChange={value => setMode(value as 'fill' | 'replace')} value={mode}>
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="fill" />
                {t('modeFill')}
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="replace" />
                {t('modeReplace')}
              </Label>
            </RadioGroup>
          </fieldset>
          {replace && <Banner variant="warning">{t('replaceWarning')}</Banner>}
          {chosen.length > 0 && total === 0 && !started && (
            <p className="text-sm text-muted-foreground">{t('nothingToDo')}</p>
          )}
          {started && (
            <div className="flex flex-col gap-2" data-slot="translate-progress">
              <Progress
                aria-label={t('progress', { done: translate.progress.done, total: translate.progress.total })}
                value={translate.progress.total ? (translate.progress.done / translate.progress.total) * 100 : 0}
              />
              <p aria-live="polite" className="text-sm tabular-nums">
                {t('progress', { done: translate.progress.done, total: translate.progress.total })}
              </p>
              <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
                {chosen.map(locale => (
                  <li key={locale}>
                    {t('progressLanguage', {
                      done: (completed[locale] ?? 0) + translate.failures.filter(item => item.locale === locale).length,
                      language: nameOf(locale),
                      total: runTotals[locale] ?? 0,
                    })}
                  </li>
                ))}
              </ul>
              {translate.status === 'cancelled' && (
                <Banner variant="info">{t('cancelled', { count: appliedCount })}</Banner>
              )}
              {translate.failures.length > 0 && !running && (
                <Banner variant="warning">{t('failed', { count: translate.failures.length })}</Banner>
              )}
              {errorKey && <Banner variant="destructive">{t(`errors.${errorKey}`)}</Banner>}
              {canRetry && (
                <Button className="self-start" onClick={retry} size="sm" type="button" variant="outline">
                  {t('retry')}
                </Button>
              )}
              {translate.status === 'done' && translate.failures.length === 0 && (
                <Banner variant="success">{t('done')}</Banner>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          {running ? (
            <Button onClick={translate.cancel} type="button" variant="outline">
              {t('cancel')}
            </Button>
          ) : (
            <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
              {started ? t('close') : t('cancel')}
            </Button>
          )}
          <Button disabled={!canRun} icon="sparkles" loading={running} onClick={run} type="button" variant="brand">
            {t('run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
